use common_canister_impl::components::cmc::interface::Cmc;
use common_canister_impl::components::ic::Ic;
use common_canister_impl::components::ic_management::IcManagement;
use common_canister_impl::components::icrc2_ledger::ICRC2Ledger;
use common_canister_impl::components::ledger::Ledger;
use common_canister_impl::components::logger::Logger;
use common_canister_impl::components::rand::RandGenerator;
use common_canister_impl::components::time::Time;
use common_certification::Certification;
use std::rc::Rc;

pub mod factory;

pub struct Environment {
    ic: Rc<dyn Ic>,
    ic_management: Rc<dyn IcManagement>,
    ledger: Rc<dyn Ledger>,
    icrc2_ledger: Rc<dyn ICRC2Ledger>,
    logger: Rc<dyn Logger>,
    time: Rc<dyn Time>,
    cmc: Rc<dyn Cmc>,
    rand: Rc<dyn RandGenerator>,
    certification: Rc<dyn Certification>,
}

impl Environment {
    #[allow(clippy::too_many_arguments)]
    pub fn new(
        ledger: Box<dyn Ledger>,
        icrc2_ledger: Box<dyn ICRC2Ledger>,
        logger: Box<dyn Logger>,
        time: Box<dyn Time>,
        cmc: Box<dyn Cmc>,
        rand: Box<dyn RandGenerator>,
        ic: Box<dyn Ic>,
        ic_management: Box<dyn IcManagement>,
        certification: Box<dyn Certification>,
    ) -> Self {
        Self {
            ic: ic.into(),
            ic_management: ic_management.into(),
            logger: logger.into(),
            ledger: ledger.into(),
            icrc2_ledger: icrc2_ledger.into(),
            time: time.into(),
            cmc: cmc.into(),
            rand: rand.into(),
            certification: certification.into(),
        }
    }

    pub fn get_ledger(&self) -> Rc<dyn Ledger> {
        Rc::clone(&self.ledger)
    }

    pub fn get_icrc2_ledger(&self) -> Rc<dyn ICRC2Ledger> {
        Rc::clone(&self.icrc2_ledger)
    }

    pub fn get_logger(&self) -> Rc<dyn Logger> {
        Rc::clone(&self.logger)
    }

    pub fn get_ic(&self) -> Rc<dyn Ic> {
        Rc::clone(&self.ic)
    }

    pub fn get_ic_management(&self) -> Rc<dyn IcManagement> {
        Rc::clone(&self.ic_management)
    }

    pub fn get_time(&self) -> Rc<dyn Time> {
        Rc::clone(&self.time)
    }

    pub fn get_cmc(&self) -> Rc<dyn Cmc> {
        Rc::clone(&self.cmc)
    }

    pub fn get_rand(&self) -> Rc<dyn RandGenerator> {
        Rc::clone(&self.rand)
    }

    pub fn get_certification(&self) -> Rc<dyn Certification> {
        Rc::clone(&self.certification)
    }
}

#[macro_export]
macro_rules! log_debug {
    ($dst:expr, $($arg:tt)*) => {
        $dst.get_logger().debug(format!($($arg)*).as_str());
    };
}

#[macro_export]
macro_rules! log_info {
    ($dst:expr, $($arg:tt)*) => {
        $dst.get_logger().info(format!($($arg)*).as_str());
    };
}

#[macro_export]
macro_rules! log_error {
    ($dst:expr, $($arg:tt)*) => {
        $dst.get_logger().error(format!($($arg)*).as_str());
    };
}
