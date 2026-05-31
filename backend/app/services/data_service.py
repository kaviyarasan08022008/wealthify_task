from sqlalchemy.orm import Session
from sqlalchemy import func, case
from typing import Optional, List, Dict
from datetime import datetime, date
from app.models.models import Investor, Fund, Transaction


def _parse_date(date_str: Optional[str]) -> Optional[date]:
    """Safely parse a date string to a date object."""
    if not date_str:
        return None
    try:
        return datetime.strptime(date_str, "%Y-%m-%d").date()
    except (ValueError, TypeError):
        return None


class DataService:
    """Service layer: all DB queries via SQLAlchemy ORM."""

    # ------------------------------------------------------------------ #
    #  Investor Summary: grouped by (investor_name, mutual_fund)           #
    # ------------------------------------------------------------------ #
    def get_investor_summary(
        self,
        db: Session,
        start_date: str = None,
        end_date: str = None,
        search: str = None,
        page: int = 1,
        limit: int = 10,
    ) -> List[Dict]:
        q_invs = db.query(
            Investor.name.label("investor_name"),
            func.sum(Transaction.amount).label("total_amount"),
            func.sum(Transaction.units).label("total_units"),
        ).join(Transaction.investor)
        q_invs = self._apply_date_filter(q_invs, start_date, end_date)
        if search:
            q_invs = q_invs.filter(Investor.name.ilike(f"%{search}%"))
        
        q_invs = (
            q_invs.group_by(Investor.name)
            .order_by(func.sum(Transaction.amount).desc())
        )
        inv_rows = q_invs.offset((page - 1) * limit).limit(limit).all()

        results = []
        for inv_r in inv_rows:
            q_funds = db.query(
                Fund.name.label("mutual_fund"),
                func.sum(Transaction.amount).label("total_amount"),
                func.sum(Transaction.units).label("total_units"),
            ).join(Transaction.fund).join(Transaction.investor).filter(Investor.name == inv_r.investor_name)
            q_funds = self._apply_date_filter(q_funds, start_date, end_date)
            q_funds = (
                q_funds.group_by(Fund.name)
                .order_by(func.sum(Transaction.amount).desc())
            )
            fund_rows = q_funds.all()

            results.append({
                "investor_name": inv_r.investor_name,
                "total_amount": float(inv_r.total_amount or 0),
                "total_units": float(inv_r.total_units or 0),
                "funds": [
                    {
                        "mutual_fund": fr.mutual_fund,
                        "total_amount": float(fr.total_amount or 0),
                        "total_units": float(fr.total_units or 0),
                    }
                    for fr in fund_rows
                ]
            })
        return results

    # ------------------------------------------------------------------ #
    #  Fund Summary: grouped by (mutual_fund, investor_name)               #
    # ------------------------------------------------------------------ #
    def get_fund_summary(
        self,
        db: Session,
        start_date: str = None,
        end_date: str = None,
        page: int = 1,
        limit: int = 10,
    ) -> List[Dict]:
        q_funds = db.query(
            Fund.name.label("mutual_fund"),
            func.sum(Transaction.amount).label("total_amount"),
            func.sum(Transaction.units).label("total_units"),
        ).join(Transaction.fund)
        q_funds = self._apply_date_filter(q_funds, start_date, end_date)
        
        q_funds = (
            q_funds.group_by(Fund.name)
            .order_by(Fund.name)
        )
        fund_rows = q_funds.offset((page - 1) * limit).limit(limit).all()

        results = []
        for fund_r in fund_rows:
            q_invs = db.query(
                Investor.name.label("investor_name"),
                func.sum(Transaction.amount).label("amount"),
                func.sum(Transaction.units).label("units"),
            ).join(Transaction.investor).join(Transaction.fund).filter(Fund.name == fund_r.mutual_fund)
            q_invs = self._apply_date_filter(q_invs, start_date, end_date)
            q_invs = (
                q_invs.group_by(Investor.name)
                .order_by(func.sum(Transaction.amount).desc())
            )
            inv_rows = q_invs.all()

            results.append({
                "mutual_fund": fund_r.mutual_fund,
                "total_amount": float(fund_r.total_amount or 0),
                "total_units": float(fund_r.total_units or 0),
                "investors": [
                    {
                        "investor_name": ir.investor_name,
                        "amount": float(ir.amount or 0),
                        "units": float(ir.units or 0),
                    }
                    for ir in inv_rows
                ]
            })
        return results

    # ------------------------------------------------------------------ #
    #  All Investors: grouped by (investor_name, pan_number)               #
    # ------------------------------------------------------------------ #
    def get_investors(
        self,
        db: Session,
        start_date: str = None,
        end_date: str = None,
        search: str = None,
        page: int = 1,
        limit: int = 10,
    ) -> List[Dict]:
        q = db.query(
            Investor.id.label("id"),
            Investor.name.label("investor_name"),
            Investor.pan_number.label("pan_number"),
            func.sum(Transaction.amount).label("total_investment"),
        ).outerjoin(Transaction, Investor.id == Transaction.investor_id)
        q = self._apply_date_filter(q, start_date, end_date)
        if search:
            q = q.filter(Investor.name.ilike(f"%{search}%"))
        q = (
            q.group_by(Investor.id, Investor.name, Investor.pan_number)
            .order_by(func.sum(Transaction.amount).desc())
        )
        rows = q.offset((page - 1) * limit).limit(limit).all()
        return [
            {
                "id": r.id,
                "investor_name": r.investor_name,
                "pan_number": r.pan_number,
                "total_investment": float(r.total_investment or 0),
            }
            for r in rows
        ]

    # ------------------------------------------------------------------ #
    #  Mutual Fund Overall: grouped by mutual_fund                         #
    # ------------------------------------------------------------------ #
    def get_mutualfund_overall(
        self,
        db: Session,
        start_date: str = None,
        end_date: str = None,
    ) -> List[Dict]:
        q = db.query(
            Fund.name.label("mutual_fund"),
            func.sum(Transaction.amount).label("total_amount"),
            func.sum(Transaction.units).label("total_units"),
        ).join(Transaction.fund)
        q = self._apply_date_filter(q, start_date, end_date)
        q = q.group_by(Fund.name).order_by(
            func.sum(Transaction.amount).desc()
        )
        rows = q.all()
        result = []
        for r in rows:
            total_amount = float(r.total_amount or 0)
            total_units = float(r.total_units or 0)
            avg_nav = (total_amount / total_units) if total_units > 0 else 0.0
            result.append(
                {
                    "mutual_fund": r.mutual_fund,
                    "total_amount": total_amount,
                    "total_units": total_units,
                    "average_nav": avg_nav,
                }
            )
        return result


    # ------------------------------------------------------------------ #
    #  Investor CRUD Methods                                             #
    # ------------------------------------------------------------------ #
    def create_investor(self, db: Session, investor_data) -> Investor:
        db_investor = Investor(
            name=investor_data.name,
            pan_number=investor_data.pan_number
        )
        db.add(db_investor)
        db.commit()
        db.refresh(db_investor)
        return db_investor

    def get_investor(self, db: Session, investor_id: int) -> Optional[Investor]:
        return db.query(Investor).filter(Investor.id == investor_id).first()

    def update_investor(self, db: Session, investor_id: int, investor_data) -> Optional[Investor]:
        db_investor = self.get_investor(db, investor_id)
        if not db_investor:
            return None
        
        update_data = investor_data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_investor, key, value)
            
        db.commit()
        db.refresh(db_investor)
        return db_investor

    def delete_investor(self, db: Session, investor_id: int) -> bool:
        db_investor = self.get_investor(db, investor_id)
        if not db_investor:
            return False
        db.delete(db_investor)
        db.commit()
        return True

    def list_investors_records(
        self,
        db: Session,
        search: Optional[str] = None,
        page: int = 1,
        limit: int = 10,
    ) -> List[Investor]:
        q = db.query(Investor)
        if search:
            q = q.filter(
                (Investor.name.ilike(f"%{search}%")) |
                (Investor.pan_number.ilike(f"%{search}%"))
            )
        q = q.order_by(Investor.name.asc())
        return q.offset((page - 1) * limit).limit(limit).all()


    # ------------------------------------------------------------------ #
    #  Fund CRUD Methods                                                 #
    # ------------------------------------------------------------------ #
    def create_fund(self, db: Session, fund_data) -> Fund:
        db_fund = Fund(
            name=fund_data.name,
            amc_code=fund_data.amc_code,
            scheme_type=fund_data.scheme_type
        )
        db.add(db_fund)
        db.commit()
        db.refresh(db_fund)
        return db_fund

    def get_fund(self, db: Session, fund_id: int) -> Optional[Fund]:
        return db.query(Fund).filter(Fund.id == fund_id).first()

    def update_fund(self, db: Session, fund_id: int, fund_data) -> Optional[Fund]:
        db_fund = self.get_fund(db, fund_id)
        if not db_fund:
            return None
        
        update_data = fund_data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_fund, key, value)
            
        db.commit()
        db.refresh(db_fund)
        return db_fund

    def delete_fund(self, db: Session, fund_id: int) -> bool:
        db_fund = self.get_fund(db, fund_id)
        if not db_fund:
            return False
        db.delete(db_fund)
        db.commit()
        return True

    def list_funds_records(
        self,
        db: Session,
        search: Optional[str] = None,
        page: int = 1,
        limit: int = 10,
    ) -> List[Fund]:
        q = db.query(Fund)
        if search:
            q = q.filter(
                (Fund.name.ilike(f"%{search}%")) |
                (Fund.amc_code.ilike(f"%{search}%")) |
                (Fund.scheme_type.ilike(f"%{search}%"))
            )
        q = q.order_by(Fund.name.asc())
        return q.offset((page - 1) * limit).limit(limit).all()


    # ------------------------------------------------------------------ #
    #  Transaction CRUD Methods                                          #
    # ------------------------------------------------------------------ #
    def create_transaction(self, db: Session, transaction_data) -> Transaction:
        db_transaction = Transaction(
            investor_id=transaction_data.investor_id,
            fund_id=transaction_data.fund_id,
            transaction_date=transaction_data.transaction_date,
            amount=transaction_data.amount,
            nav=transaction_data.nav,
            units=transaction_data.units,
            folio_no=transaction_data.folio_no,
            location=transaction_data.location,
            tax_status=transaction_data.tax_status
        )
        db.add(db_transaction)
        db.commit()
        db.refresh(db_transaction)
        return db_transaction

    def get_transaction(self, db: Session, transaction_id: int) -> Optional[Transaction]:
        return db.query(Transaction).filter(Transaction.id == transaction_id).first()

    def update_transaction(self, db: Session, transaction_id: int, transaction_data) -> Optional[Transaction]:
        db_transaction = self.get_transaction(db, transaction_id)
        if not db_transaction:
            return None
        
        update_data = transaction_data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_transaction, key, value)
            
        db.commit()
        db.refresh(db_transaction)
        return db_transaction

    def delete_transaction(self, db: Session, transaction_id: int) -> bool:
        db_transaction = self.get_transaction(db, transaction_id)
        if not db_transaction:
            return False
        db.delete(db_transaction)
        db.commit()
        return True

    def list_transactions(
        self,
        db: Session,
        search: Optional[str] = None,
        page: int = 1,
        limit: int = 10,
    ) -> List[Transaction]:
        q = db.query(Transaction).join(Transaction.investor).join(Transaction.fund)
        if search:
            q = q.filter(
                (Investor.name.ilike(f"%{search}%")) |
                (Fund.name.ilike(f"%{search}%")) |
                (Investor.pan_number.ilike(f"%{search}%"))
            )
        q = q.order_by(Transaction.id.asc())
        return q.offset((page - 1) * limit).limit(limit).all()


    # ------------------------------------------------------------------ #
    #  Private Helpers                                                      #
    # ------------------------------------------------------------------ #
    def _apply_date_filter(self, query, start_date: str, end_date: str):
        start = _parse_date(start_date)
        end = _parse_date(end_date)
        if start:
            query = query.filter(Transaction.transaction_date >= start)
        if end:
            query = query.filter(Transaction.transaction_date <= end)
        return query


data_service = DataService()
