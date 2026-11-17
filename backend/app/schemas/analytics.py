from pydantic import BaseModel
from typing import List, Dict

class BalanceSummaryResponse(BaseModel):
    total_balance_paise: int
    monthly_income_paise: int
    monthly_expense_paise: int
    monthly_net_paise: int
    money_exchanged_paise: int
    pending_count: int

class CategorySpendItem(BaseModel):
    category_id: str
    category_name: str
    category_icon: str
    amount_paise: int
    percentage: float

class AnalyticsOverviewResponse(BaseModel):
    summary: BalanceSummaryResponse
    category_distribution: List[CategorySpendItem]

