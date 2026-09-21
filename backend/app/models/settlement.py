from pydantic import BaseModel, Field
from typing import List, Optional

class CalculationStep(BaseModel):
    description: str
    amount: float
    rule_source: Optional[str] = None

class Settlement(BaseModel):
    claimed_amount: float
    eligible_amount: float
    coverage_limit: float
    deductible: float
    preliminary_payable: float
    calculation_steps: List[CalculationStep] = Field(default_factory=list)
