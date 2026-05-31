from pydantic import BaseModel
from typing import Optional, List
from datetime import date as date_type

# ── Existing Dashboard Response Schemas ──

class InvestorSummaryDetail(BaseModel):
    mutual_fund: str
    total_amount: float
    total_units: float

    model_config = {"from_attributes": True}

class InvestorSummaryResponse(BaseModel):
    investor_name: str
    total_amount: float
    total_units: float
    funds: List[InvestorSummaryDetail]

    model_config = {"from_attributes": True}

class FundSummaryDetail(BaseModel):
    investor_name: str
    amount: float
    units: float

    model_config = {"from_attributes": True}

class FundSummaryResponse(BaseModel):
    mutual_fund: str
    total_amount: float
    total_units: float
    investors: List[FundSummaryDetail]

    model_config = {"from_attributes": True}

class InvestorResponse(BaseModel):
    id: int
    investor_name: str
    pan_number: str
    total_investment: float

    model_config = {"from_attributes": True}

class MutualFundOverallResponse(BaseModel):
    mutual_fund: str
    total_amount: float
    total_units: float
    average_nav: float

    model_config = {"from_attributes": True}

class HealthResponse(BaseModel):
    status: str


# ── New Investor CRUD Schemas ──

class InvestorBase(BaseModel):
    name: str
    pan_number: str

class InvestorCreate(InvestorBase):
    pass

class InvestorUpdate(BaseModel):
    name: Optional[str] = None
    pan_number: Optional[str] = None

class InvestorCRUDResponse(InvestorBase):
    id: int

    model_config = {"from_attributes": True}


# ── New Fund CRUD Schemas ──

class FundBase(BaseModel):
    name: str
    amc_code: Optional[str] = None
    scheme_type: Optional[str] = None

class FundCreate(FundBase):
    pass

class FundUpdate(BaseModel):
    name: Optional[str] = None
    amc_code: Optional[str] = None
    scheme_type: Optional[str] = None

class FundCRUDResponse(FundBase):
    id: int

    model_config = {"from_attributes": True}


# ── New Transaction CRUD Schemas ──

class TransactionBase(BaseModel):
    investor_id: int
    fund_id: int
    transaction_date: date_type
    amount: float
    nav: float
    units: float
    folio_no: Optional[str] = None
    location: Optional[str] = None
    tax_status: Optional[str] = None

class TransactionCreate(TransactionBase):
    pass

class TransactionUpdate(BaseModel):
    investor_id: Optional[int] = None
    fund_id: Optional[int] = None
    transaction_date: Optional[date_type] = None
    amount: Optional[float] = None
    nav: Optional[float] = None
    units: Optional[float] = None
    folio_no: Optional[str] = None
    location: Optional[str] = None
    tax_status: Optional[str] = None

class TransactionCRUDResponse(TransactionBase):
    id: int

    model_config = {"from_attributes": True}
