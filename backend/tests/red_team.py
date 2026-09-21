import concurrent.futures
import requests
import time
import os

API_BASE = "http://localhost:8000/api"
NUM_CLAIMS = 5

def simulate_claim(index):
    print(f"[Claim {index}] Starting creation...")
    try:
        # 1. Create
        create_res = requests.post(f"{API_BASE}/claims")
        create_res.raise_for_status()
        claim_id = create_res.json()["claim_id"]
        print(f"[Claim {index}] Created claim ID: {claim_id[:8]}...")
        
        # 2. Upload dummy doc
        files = {'file': ('dummy.pdf', b'Dummy content for red team test.', 'application/pdf')}
        doc_res = requests.post(f"{API_BASE}/claims/{claim_id}/documents", files=files)
        doc_res.raise_for_status()
        print(f"[Claim {index}] Uploaded dummy document.")
        
        # 3. Process
        proc_res = requests.post(f"{API_BASE}/claims/{claim_id}/process")
        proc_res.raise_for_status()
        print(f"[Claim {index}] Started processing!")
        
        # 4. Poll until completed or failed
        start_time = time.time()
        while True:
            status_res = requests.get(f"{API_BASE}/claims/{claim_id}/status")
            if status_res.status_code == 200:
                data = status_res.json()
                status = data.get("workflow_status")
                agent = data.get("current_agent")
                
                if status in ["COMPLETED", "APPROVED", "REJECTED", "FAILED"]:
                    elapsed = int(time.time() - start_time)
                    print(f"[Claim {index}] ✅ Finished in {elapsed}s with status: {status}")
                    break
                    
            time.sleep(5)
            
        return True
    except Exception as e:
        print(f"[Claim {index}] ❌ Error: {e}")
        return False

def main():
    print(f"Starting Red Team Test: Firing {NUM_CLAIMS} concurrent claims at the AI Workflow...")
    start = time.time()
    
    with concurrent.futures.ThreadPoolExecutor(max_workers=NUM_CLAIMS) as executor:
        futures = [executor.submit(simulate_claim, i+1) for i in range(NUM_CLAIMS)]
        
        results = [f.result() for f in concurrent.futures.as_completed(futures)]
        
    elapsed = int(time.time() - start)
    success_count = sum(results)
    print(f"\nTest Complete in {elapsed}s!")
    print(f" Success: {success_count}/{NUM_CLAIMS}")
    print(f" Failed: {NUM_CLAIMS - success_count}/{NUM_CLAIMS}")

if __name__ == "__main__":
    main()
