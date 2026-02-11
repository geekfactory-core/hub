use common_canister_impl::components::logger::Logger;

pub struct PrintLoggerImpl;

impl Logger for PrintLoggerImpl {
    fn debug(&self, message: &str) {
        println!("DEBUG {message}");
    }

    fn info(&self, message: &str) {
        println!("INFO {message}");
    }

    fn error(&self, error: &str) {
        println!("ERROR {error}");
    }
}
