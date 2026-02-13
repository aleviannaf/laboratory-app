CREATE INDEX idx_exams_patient_id ON exams(patient_id);
CREATE INDEX idx_exams_requester_id ON exams(requester_id);
CREATE INDEX idx_exam_items_exam_id ON exam_items(exam_id);
CREATE INDEX idx_audit_log_entity ON audit_log(entity_name, entity_id);
CREATE INDEX idx_audit_log_performed_at ON audit_log(performed_at);
