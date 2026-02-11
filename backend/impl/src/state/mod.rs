use crate::components::Environment;
use crate::model::DataModel;
use std::rc::Rc;

pub struct CanisterState {
    env: Rc<Environment>,
    model: DataModel,
}

impl CanisterState {
    pub fn new(env: Environment, model: DataModel) -> Self {
        let env = Rc::new(env);
        Self { env, model }
    }

    pub fn get_env(&self) -> Rc<Environment> {
        Rc::clone(&self.env)
    }

    pub fn get_model(&self) -> &DataModel {
        &self.model
    }

    pub fn get_model_mut(&mut self) -> &mut DataModel {
        &mut self.model
    }
}
