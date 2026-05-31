from fastapi import APIRouter, Query, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List, Optional
from app.schemas.schemas import (
    InvestorSummaryResponse,
    FundSummaryResponse,
    InvestorResponse,
    MutualFundOverallResponse,
    HealthResponse,
    InvestorCreate,
    InvestorUpdate,
    InvestorCRUDResponse,
    FundCreate,
    FundUpdate,
    FundCRUDResponse,
    TransactionCreate,
    TransactionUpdate,
    TransactionCRUDResponse,
)
from app.services.data_service import data_service
from app.core.database import get_db

router = APIRouter(prefix="/api")


@router.get("/health", response_model=HealthResponse)
def health_check():
    return {"status": "healthy"}


@router.get("/investor-summary", response_model=List[InvestorSummaryResponse])
def get_investor_summary(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
):
    try:
        return data_service.get_investor_summary(db, start_date, end_date, search, page, limit)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/fund-summary", response_model=List[FundSummaryResponse])
def get_fund_summary(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
):
    try:
        return data_service.get_fund_summary(db, start_date, end_date, page, limit)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/investors", response_model=List[InvestorResponse])
def get_investors(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
):
    try:
        return data_service.get_investors(db, start_date, end_date, search, page, limit)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/mutualfund-overall", response_model=List[MutualFundOverallResponse])
def get_mutualfund_overall(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db),
):
    try:
        return data_service.get_mutualfund_overall(db, start_date, end_date)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Investor CRUD Endpoints ──

@router.get("/investors/list", response_model=List[InvestorCRUDResponse])
def list_investors(
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
):
    try:
        return data_service.list_investors_records(db, search, page, limit)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/investors", response_model=InvestorCRUDResponse)
def create_investor(
    investor_data: InvestorCreate,
    db: Session = Depends(get_db),
):
    try:
        return data_service.create_investor(db, investor_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/investors/{id}", response_model=InvestorCRUDResponse)
def get_investor(
    id: int,
    db: Session = Depends(get_db),
):
    db_investor = data_service.get_investor(db, id)
    if not db_investor:
        raise HTTPException(status_code=404, detail="Investor not found")
    return db_investor


@router.put("/investors/{id}", response_model=InvestorCRUDResponse)
def update_investor(
    id: int,
    investor_data: InvestorUpdate,
    db: Session = Depends(get_db),
):
    db_investor = data_service.update_investor(db, id, investor_data)
    if not db_investor:
        raise HTTPException(status_code=404, detail="Investor not found")
    return db_investor


@router.delete("/investors/{id}")
def delete_investor(
    id: int,
    db: Session = Depends(get_db),
):
    success = data_service.delete_investor(db, id)
    if not success:
        raise HTTPException(status_code=404, detail="Investor not found")
    return {"message": "Investor deleted successfully"}


# ── Fund CRUD Endpoints ──

@router.get("/funds/list", response_model=List[FundCRUDResponse])
def list_funds(
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
):
    try:
        return data_service.list_funds_records(db, search, page, limit)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/funds", response_model=FundCRUDResponse)
def create_fund(
    fund_data: FundCreate,
    db: Session = Depends(get_db),
):
    try:
        return data_service.create_fund(db, fund_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/funds/{id}", response_model=FundCRUDResponse)
def get_fund(
    id: int,
    db: Session = Depends(get_db),
):
    db_fund = data_service.get_fund(db, id)
    if not db_fund:
        raise HTTPException(status_code=404, detail="Fund not found")
    return db_fund


@router.put("/funds/{id}", response_model=FundCRUDResponse)
def update_fund(
    id: int,
    fund_data: FundUpdate,
    db: Session = Depends(get_db),
):
    db_fund = data_service.update_fund(db, id, fund_data)
    if not db_fund:
        raise HTTPException(status_code=404, detail="Fund not found")
    return db_fund


@router.delete("/funds/{id}")
def delete_fund(
    id: int,
    db: Session = Depends(get_db),
):
    success = data_service.delete_fund(db, id)
    if not success:
        raise HTTPException(status_code=404, detail="Fund not found")
    return {"message": "Fund deleted successfully"}


# ── Transaction CRUD Endpoints ──

@router.post("/transactions", response_model=TransactionCRUDResponse)
def create_transaction(
    transaction_data: TransactionCreate,
    db: Session = Depends(get_db),
):
    try:
        return data_service.create_transaction(db, transaction_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/transactions/{id}", response_model=TransactionCRUDResponse)
def get_transaction(
    id: int,
    db: Session = Depends(get_db),
):
    db_transaction = data_service.get_transaction(db, id)
    if not db_transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return db_transaction


@router.put("/transactions/{id}", response_model=TransactionCRUDResponse)
def update_transaction(
    id: int,
    transaction_data: TransactionUpdate,
    db: Session = Depends(get_db),
):
    db_transaction = data_service.update_transaction(db, id, transaction_data)
    if not db_transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return db_transaction


@router.delete("/transactions/{id}")
def delete_transaction(
    id: int,
    db: Session = Depends(get_db),
):
    success = data_service.delete_transaction(db, id)
    if not success:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return {"message": "Transaction deleted successfully"}


@router.get("/transactions", response_model=List[TransactionCRUDResponse])
def list_transactions(
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
):
    try:
        return data_service.list_transactions(db, search, page, limit)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
