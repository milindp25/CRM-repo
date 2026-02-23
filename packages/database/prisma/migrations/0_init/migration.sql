-- CreateTable
CREATE TABLE "companies" (
    "id" UUID NOT NULL,
    "company_code" VARCHAR(50) NOT NULL,
    "company_name" VARCHAR(255) NOT NULL,
    "subscription_tier" VARCHAR(50) NOT NULL DEFAULT 'FREE',
    "subscription_status" VARCHAR(50) NOT NULL DEFAULT 'TRIAL',
    "trial_ends_at" TIMESTAMPTZ,
    "email" VARCHAR(255),
    "phone" VARCHAR(20),
    "website" VARCHAR(255),
    "address_line1" VARCHAR(255),
    "address_line2" VARCHAR(255),
    "city" VARCHAR(100),
    "state" VARCHAR(100),
    "country" VARCHAR(100) DEFAULT 'India',
    "postal_code" VARCHAR(20),
    "settings" JSONB NOT NULL DEFAULT '{}',
    "deployment_type" VARCHAR(50) NOT NULL DEFAULT 'CLOUD',
    "database_schema" VARCHAR(100),
    "features_enabled" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "onboarding_completed" BOOLEAN NOT NULL DEFAULT false,
    "onboarding_step" INTEGER NOT NULL DEFAULT 0,
    "sso_config" JSONB,
    "payroll_country" VARCHAR(5) DEFAULT 'IN',
    "pay_frequency" VARCHAR(20) DEFAULT 'MONTHLY',
    "pf_enabled" BOOLEAN NOT NULL DEFAULT false,
    "esi_enabled" BOOLEAN NOT NULL DEFAULT false,
    "email_payslip_enabled" BOOLEAN NOT NULL DEFAULT false,
    "company_pan_encrypted" TEXT,
    "gstin_encrypted" TEXT,
    "tan_encrypted" TEXT,
    "pf_reg_no" VARCHAR(100),
    "esi_reg_no" VARCHAR(100),
    "ein_encrypted" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" TEXT,
    "supabase_auth_id" UUID,
    "google_id" VARCHAR(255),
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "phone" VARCHAR(20),
    "avatar" TEXT,
    "role" VARCHAR(50) NOT NULL,
    "permissions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "employee_id" UUID,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "last_login_at" TIMESTAMPTZ,
    "password_changed_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "departments" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "description" TEXT,
    "parent_id" UUID,
    "head_employee_id" UUID,
    "cost_center" VARCHAR(50),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "designations" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "title" VARCHAR(100) NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "description" TEXT,
    "level" INTEGER NOT NULL DEFAULT 1,
    "min_salary" DECIMAL(15,2),
    "max_salary" DECIMAL(15,2),
    "currency" VARCHAR(10) NOT NULL DEFAULT 'INR',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "designations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employees" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "employee_code" VARCHAR(50) NOT NULL,
    "first_name" VARCHAR(100) NOT NULL,
    "middle_name" VARCHAR(100),
    "last_name" VARCHAR(100) NOT NULL,
    "date_of_birth" DATE,
    "gender" VARCHAR(20),
    "work_email" VARCHAR(255) NOT NULL,
    "work_phone" VARCHAR(20),
    "personal_email_encrypted" TEXT,
    "personal_phone_encrypted" TEXT,
    "aadhaar_encrypted" TEXT,
    "pan_encrypted" TEXT,
    "passport_encrypted" TEXT,
    "address_line1" VARCHAR(255),
    "address_line2" VARCHAR(255),
    "city" VARCHAR(100),
    "state" VARCHAR(100),
    "country" VARCHAR(100) DEFAULT 'India',
    "postal_code" VARCHAR(20),
    "date_of_joining" DATE NOT NULL,
    "date_of_leaving" DATE,
    "probation_end_date" DATE,
    "department_id" UUID,
    "designation_id" UUID,
    "reporting_manager_id" UUID,
    "employment_type" VARCHAR(50) NOT NULL DEFAULT 'FULL_TIME',
    "tax_regime" VARCHAR(10),
    "filing_status" VARCHAR(50),
    "w4_allowances" INTEGER DEFAULT 0,
    "ssn_encrypted" TEXT,
    "uan_encrypted" TEXT,
    "salary_structure_id" UUID,
    "annual_ctc" DECIMAL(15,2),
    "notice_period_days" INTEGER,
    "termination_reason" TEXT,
    "status" VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
    "attendance_date" DATE NOT NULL,
    "check_in_time" TIMESTAMPTZ,
    "check_out_time" TIMESTAMPTZ,
    "total_hours" DECIMAL(5,2),
    "break_hours" DECIMAL(5,2) DEFAULT 0,
    "overtime_hours" DECIMAL(5,2) DEFAULT 0,
    "status" VARCHAR(50) NOT NULL DEFAULT 'PRESENT',
    "is_wfh" BOOLEAN NOT NULL DEFAULT false,
    "check_in_latitude" DECIMAL(10,8),
    "check_in_longitude" DECIMAL(11,8),
    "check_out_latitude" DECIMAL(10,8),
    "check_out_longitude" DECIMAL(11,8),
    "ip_address" VARCHAR(45),
    "location_verified" BOOLEAN NOT NULL DEFAULT false,
    "is_regularized" BOOLEAN NOT NULL DEFAULT false,
    "regularized_by" UUID,
    "regularized_at" TIMESTAMPTZ,
    "regularization_reason" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leaves" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
    "leave_type" VARCHAR(50) NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "total_days" DECIMAL(5,2) NOT NULL,
    "is_half_day" BOOLEAN NOT NULL DEFAULT false,
    "half_day_type" VARCHAR(20),
    "reason" TEXT NOT NULL,
    "contact_during_leave" VARCHAR(255),
    "status" VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    "applied_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approved_by" UUID,
    "approved_at" TIMESTAMPTZ,
    "approval_notes" TEXT,
    "cancelled_at" TIMESTAMPTZ,
    "cancellation_reason" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "leaves_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payroll" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
    "pay_period_month" INTEGER NOT NULL,
    "pay_period_year" INTEGER NOT NULL,
    "pay_date" DATE,
    "country" VARCHAR(5) NOT NULL DEFAULT 'IN',
    "pay_frequency" VARCHAR(20) NOT NULL DEFAULT 'MONTHLY',
    "is_bonus" BOOLEAN NOT NULL DEFAULT false,
    "bonus_amount" DECIMAL(15,2),
    "basic_salary_encrypted" TEXT NOT NULL,
    "hra_encrypted" TEXT,
    "special_allowance_encrypted" TEXT,
    "other_allowances_encrypted" TEXT,
    "gross_salary_encrypted" TEXT NOT NULL,
    "net_salary_encrypted" TEXT NOT NULL,
    "earnings_breakdown" JSONB,
    "pf_employee" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "pf_employer" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "esi_employee" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "esi_employer" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "tds" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "pt" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "other_deductions" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "ss_employee" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "ss_employer" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "medicare_employee" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "medicare_employer" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "federal_tax" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "state_tax" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "days_worked" INTEGER NOT NULL,
    "days_in_month" INTEGER NOT NULL,
    "leave_days" INTEGER NOT NULL DEFAULT 0,
    "absent_days" INTEGER NOT NULL DEFAULT 0,
    "overtime_hours" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "bank_account_encrypted" TEXT,
    "ifsc_code_encrypted" TEXT,
    "bank_name" VARCHAR(100),
    "routing_number_encrypted" TEXT,
    "status" VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
    "paid_at" TIMESTAMPTZ,
    "approval_status" VARCHAR(30),
    "batch_id" UUID,
    "salary_structure_id" UUID,
    "tax_regime_used" VARCHAR(10),
    "computation_breakdown" JSONB,
    "payslip_path" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "payroll_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "salary_structures" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "country" VARCHAR(5) NOT NULL DEFAULT 'IN',
    "components" JSONB NOT NULL,
    "designation_id" UUID,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "salary_structures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payroll_batches" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "status" VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    "total_count" INTEGER NOT NULL DEFAULT 0,
    "processed_count" INTEGER NOT NULL DEFAULT 0,
    "failed_count" INTEGER NOT NULL DEFAULT 0,
    "errors" JSONB,
    "initiated_by" UUID NOT NULL,
    "completed_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "payroll_batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payroll_ytd" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
    "fiscal_year" INTEGER NOT NULL,
    "gross_earnings_encrypted" TEXT NOT NULL,
    "total_deductions_encrypted" TEXT NOT NULL,
    "tax_paid_encrypted" TEXT NOT NULL,
    "pf_employee_ytd" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "pf_employer_ytd" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "esi_employee_ytd" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "esi_employer_ytd" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "tds_ytd" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "pt_ytd" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "ss_employee_ytd" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "ss_employer_ytd" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "medicare_ytd" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "federal_tax_ytd" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "state_tax_ytd" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "payroll_ytd_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tax_configurations" (
    "id" UUID NOT NULL,
    "company_id" UUID,
    "country" VARCHAR(5) NOT NULL,
    "config_key" VARCHAR(100) NOT NULL,
    "config_value" JSONB NOT NULL,
    "fiscal_year" INTEGER NOT NULL,
    "effective_from" TIMESTAMPTZ NOT NULL,
    "effective_to" TIMESTAMPTZ NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "tax_configurations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "user_id" UUID,
    "user_email" VARCHAR(255),
    "action" VARCHAR(50) NOT NULL,
    "resource_type" VARCHAR(100) NOT NULL,
    "resource_id" UUID,
    "old_values" JSONB,
    "new_values" JSONB,
    "ip_address" VARCHAR(45),
    "user_agent" TEXT,
    "request_id" UUID,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "failure_reason" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "message" TEXT NOT NULL,
    "resource_type" VARCHAR(100),
    "resource_id" UUID,
    "action_url" TEXT,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMPTZ,
    "email_sent" BOOLEAN NOT NULL DEFAULT false,
    "email_sent_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invitations" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "role" VARCHAR(50) NOT NULL,
    "token" VARCHAR(255) NOT NULL,
    "invited_by" UUID NOT NULL,
    "status" VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    "expires_at" TIMESTAMPTZ NOT NULL,
    "accepted_at" TIMESTAMPTZ,
    "accepted_user_id" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "invitations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "file_name" VARCHAR(255) NOT NULL,
    "file_path" TEXT NOT NULL,
    "mime_type" VARCHAR(100) NOT NULL,
    "file_size" INTEGER NOT NULL,
    "category" VARCHAR(100) NOT NULL,
    "employee_id" UUID,
    "uploaded_by" UUID NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_templates" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "entity_type" VARCHAR(100) NOT NULL,
    "steps" JSONB NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "workflow_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_instances" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "template_id" UUID NOT NULL,
    "entity_type" VARCHAR(100) NOT NULL,
    "entity_id" UUID NOT NULL,
    "initiated_by" UUID NOT NULL,
    "current_step_order" INTEGER NOT NULL DEFAULT 1,
    "status" VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    "completed_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "workflow_instances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_steps" (
    "id" UUID NOT NULL,
    "instance_id" UUID NOT NULL,
    "step_order" INTEGER NOT NULL,
    "approver_type" VARCHAR(50) NOT NULL,
    "approver_value" VARCHAR(255) NOT NULL,
    "status" VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    "resolved_by" UUID,
    "resolved_at" TIMESTAMPTZ,
    "comments" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "workflow_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_keys" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "prefix" VARCHAR(10) NOT NULL,
    "key_hash" TEXT NOT NULL,
    "permissions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "rate_limit" INTEGER NOT NULL DEFAULT 1000,
    "expires_at" TIMESTAMPTZ,
    "last_used_at" TIMESTAMPTZ,
    "created_by" UUID NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "revoked_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_endpoints" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "url" TEXT NOT NULL,
    "secret" TEXT NOT NULL,
    "events" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "headers" JSONB NOT NULL DEFAULT '{}',
    "max_retries" INTEGER NOT NULL DEFAULT 3,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "webhook_endpoints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_deliveries" (
    "id" UUID NOT NULL,
    "endpoint_id" UUID NOT NULL,
    "event_type" VARCHAR(100) NOT NULL,
    "payload" JSONB NOT NULL,
    "status" VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    "status_code" INTEGER,
    "response" TEXT,
    "attempt" INTEGER NOT NULL DEFAULT 1,
    "max_retries" INTEGER NOT NULL,
    "next_retry_at" TIMESTAMPTZ,
    "delivered_at" TIMESTAMPTZ,
    "duration" INTEGER,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "webhook_deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "custom_field_definitions" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "field_key" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "entity_type" VARCHAR(100) NOT NULL,
    "field_type" VARCHAR(50) NOT NULL,
    "options" JSONB,
    "is_required" BOOLEAN NOT NULL DEFAULT false,
    "default_value" TEXT,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "custom_field_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "custom_field_values" (
    "id" UUID NOT NULL,
    "definition_id" UUID NOT NULL,
    "entity_id" UUID NOT NULL,
    "value" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "custom_field_values_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_cycles" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "cycle_type" VARCHAR(50) NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "self_review_deadline" TIMESTAMPTZ,
    "manager_review_deadline" TIMESTAMPTZ,
    "rating_scale" JSONB,
    "status" VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "review_cycles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "performance_reviews" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "cycle_id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
    "reviewer_id" UUID,
    "self_rating" DECIMAL(3,1),
    "self_comments" TEXT,
    "manager_rating" DECIMAL(3,1),
    "manager_comments" TEXT,
    "final_rating" DECIMAL(3,1),
    "overall_comments" TEXT,
    "status" VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    "completed_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "performance_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goals" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "category" VARCHAR(100),
    "priority" VARCHAR(50) NOT NULL DEFAULT 'MEDIUM',
    "start_date" DATE,
    "due_date" DATE,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "weightage" DECIMAL(3,2) NOT NULL DEFAULT 1,
    "key_results" JSONB,
    "review_id" UUID,
    "status" VARCHAR(50) NOT NULL DEFAULT 'NOT_STARTED',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_postings" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "requirements" TEXT,
    "location" VARCHAR(255),
    "job_type" VARCHAR(50) NOT NULL DEFAULT 'FULL_TIME',
    "experience" VARCHAR(100),
    "salary_min" DECIMAL(15,2),
    "salary_max" DECIMAL(15,2),
    "currency" VARCHAR(10) NOT NULL DEFAULT 'INR',
    "show_salary" BOOLEAN NOT NULL DEFAULT false,
    "department_id" UUID,
    "designation_id" UUID,
    "hiring_manager_id" UUID,
    "openings" INTEGER NOT NULL DEFAULT 1,
    "filled" INTEGER NOT NULL DEFAULT 0,
    "published_at" TIMESTAMPTZ,
    "closing_date" DATE,
    "status" VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "job_postings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "applicants" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "job_posting_id" UUID NOT NULL,
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(20),
    "resume_path" TEXT,
    "cover_letter" TEXT,
    "source" VARCHAR(100),
    "stage" VARCHAR(50) NOT NULL DEFAULT 'APPLIED',
    "stage_notes" TEXT,
    "rating" INTEGER,
    "offer_salary" DECIMAL(15,2),
    "offer_date" DATE,
    "join_date" DATE,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "applicants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interviews" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "applicant_id" UUID NOT NULL,
    "scheduled_at" TIMESTAMPTZ NOT NULL,
    "duration" INTEGER NOT NULL DEFAULT 60,
    "location" VARCHAR(255),
    "interview_type" VARCHAR(50) NOT NULL DEFAULT 'IN_PERSON',
    "round" INTEGER NOT NULL DEFAULT 1,
    "interviewer_id" UUID,
    "feedback" TEXT,
    "rating" INTEGER,
    "recommendation" VARCHAR(50),
    "status" VARCHAR(50) NOT NULL DEFAULT 'SCHEDULED',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "interviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_courses" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "category" VARCHAR(100),
    "instructor" VARCHAR(255),
    "content_url" TEXT,
    "duration" INTEGER,
    "start_date" DATE,
    "end_date" DATE,
    "max_enrollments" INTEGER,
    "is_mandatory" BOOLEAN NOT NULL DEFAULT false,
    "status" VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "training_courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_enrollments" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "course_id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "completed_at" TIMESTAMPTZ,
    "score" DECIMAL(5,2),
    "passed" BOOLEAN,
    "certificate_url" TEXT,
    "status" VARCHAR(50) NOT NULL DEFAULT 'ENROLLED',
    "enrolled_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "training_enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assets" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "asset_code" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "category" VARCHAR(100) NOT NULL,
    "brand" VARCHAR(100),
    "model" VARCHAR(100),
    "serial_number" VARCHAR(255),
    "purchase_date" DATE,
    "purchase_price" DECIMAL(15,2),
    "warranty_expiry" DATE,
    "assigned_to" UUID,
    "assigned_at" TIMESTAMPTZ,
    "condition" VARCHAR(50) NOT NULL DEFAULT 'GOOD',
    "location" VARCHAR(255),
    "status" VARCHAR(50) NOT NULL DEFAULT 'AVAILABLE',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asset_assignments" (
    "id" UUID NOT NULL,
    "asset_id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
    "assigned_at" TIMESTAMPTZ NOT NULL,
    "returned_at" TIMESTAMPTZ,
    "assignment_notes" TEXT,
    "return_notes" TEXT,
    "condition_on_return" VARCHAR(50),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "asset_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expense_claims" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "category" VARCHAR(100) NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "currency" VARCHAR(10) NOT NULL DEFAULT 'INR',
    "receipt_path" TEXT,
    "expense_date" DATE NOT NULL,
    "status" VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    "approved_by" UUID,
    "approved_at" TIMESTAMPTZ,
    "approval_notes" TEXT,
    "reimbursed_at" TIMESTAMPTZ,
    "reimbursed_amount" DECIMAL(15,2),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "expense_claims_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shift_definitions" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "description" TEXT,
    "color" VARCHAR(7),
    "start_time" VARCHAR(5) NOT NULL,
    "end_time" VARCHAR(5) NOT NULL,
    "break_duration" INTEGER NOT NULL DEFAULT 60,
    "is_overnight" BOOLEAN NOT NULL DEFAULT false,
    "grace_minutes" INTEGER NOT NULL DEFAULT 15,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "shift_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shift_assignments" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "shift_id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
    "assignment_date" DATE NOT NULL,
    "end_date" DATE,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "shift_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "policies" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "content" TEXT NOT NULL,
    "category" VARCHAR(100) NOT NULL,
    "version" VARCHAR(20) NOT NULL DEFAULT '1.0',
    "file_path" TEXT,
    "published_at" TIMESTAMPTZ,
    "effective_date" DATE,
    "requires_acknowledgment" BOOLEAN NOT NULL DEFAULT false,
    "status" VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "policy_acknowledgments" (
    "id" UUID NOT NULL,
    "policy_id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
    "acknowledged_at" TIMESTAMPTZ NOT NULL,
    "ip_address" VARCHAR(45),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "policy_acknowledgments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feature_addons" (
    "id" UUID NOT NULL,
    "feature" VARCHAR(100) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "yearly_price" DECIMAL(10,2),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "feature_addons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_addons" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "feature_addon_id" UUID NOT NULL,
    "status" VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    "activated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "company_addons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "billing_plans" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "tier" VARCHAR(50) NOT NULL,
    "base_price" DECIMAL(10,2) NOT NULL,
    "yearly_base_price" DECIMAL(10,2),
    "price_per_employee" DECIMAL(10,2) NOT NULL,
    "price_per_user" DECIMAL(10,2) NOT NULL,
    "included_employees" INTEGER NOT NULL DEFAULT 0,
    "included_users" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "billing_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_billings" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "billing_plan_id" UUID NOT NULL,
    "billing_cycle" VARCHAR(50) NOT NULL DEFAULT 'MONTHLY',
    "current_employees" INTEGER NOT NULL DEFAULT 0,
    "current_users" INTEGER NOT NULL DEFAULT 0,
    "monthly_total" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "next_billing_date" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "company_billings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "billing_invoices" (
    "id" UUID NOT NULL,
    "company_billing_id" UUID NOT NULL,
    "invoice_number" VARCHAR(50) NOT NULL,
    "period_start" TIMESTAMPTZ NOT NULL,
    "period_end" TIMESTAMPTZ NOT NULL,
    "base_amount" DECIMAL(10,2) NOT NULL,
    "employee_amount" DECIMAL(10,2) NOT NULL,
    "user_amount" DECIMAL(10,2) NOT NULL,
    "addon_amount" DECIMAL(10,2) NOT NULL,
    "total_amount" DECIMAL(10,2) NOT NULL,
    "status" VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    "employee_count" INTEGER NOT NULL,
    "user_count" INTEGER NOT NULL,
    "line_items" JSONB NOT NULL,
    "issued_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "due_date" TIMESTAMPTZ NOT NULL,
    "paid_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "billing_invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "approval_delegations" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "delegator_id" UUID NOT NULL,
    "delegate_id" UUID NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "reason" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "scope" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "approval_delegations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "offboarding_checklists" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "items" JSONB NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "offboarding_checklists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "offboarding_processes" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
    "initiated_by" UUID NOT NULL,
    "separation_type" VARCHAR(50) NOT NULL,
    "last_working_day" DATE NOT NULL,
    "notice_period_days" INTEGER,
    "notice_period_end_date" DATE,
    "exit_interview_completed" BOOLEAN NOT NULL DEFAULT false,
    "exit_interview_notes" JSONB,
    "final_settlement_status" VARCHAR(50),
    "status" VARCHAR(50) NOT NULL DEFAULT 'INITIATED',
    "completed_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "offboarding_processes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "offboarding_tasks" (
    "id" UUID NOT NULL,
    "process_id" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "assigned_role" VARCHAR(50),
    "assigned_user_id" UUID,
    "status" VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    "completed_by" UUID,
    "completed_at" TIMESTAMPTZ,
    "notes" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "offboarding_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leave_policies" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "leave_type" VARCHAR(50) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "annual_entitlement" DECIMAL(5,1) NOT NULL,
    "accrual_type" VARCHAR(50) NOT NULL,
    "carryover_limit" DECIMAL(5,1) NOT NULL DEFAULT 0,
    "carryover_expiry_months" INTEGER,
    "max_consecutive_days" INTEGER,
    "min_service_days_required" INTEGER,
    "applicable_gender" VARCHAR(20),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "fiscal_year_start" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "leave_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leave_balances" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
    "leave_type" VARCHAR(50) NOT NULL,
    "fiscal_year" INTEGER NOT NULL,
    "entitled" DECIMAL(5,1) NOT NULL DEFAULT 0,
    "accrued" DECIMAL(5,1) NOT NULL DEFAULT 0,
    "used" DECIMAL(5,1) NOT NULL DEFAULT 0,
    "carried_over" DECIMAL(5,1) NOT NULL DEFAULT 0,
    "adjusted" DECIMAL(5,1) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "leave_balances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leave_balance_ledger" (
    "id" UUID NOT NULL,
    "balance_id" UUID NOT NULL,
    "transaction_type" VARCHAR(50) NOT NULL,
    "amount" DECIMAL(5,1) NOT NULL,
    "running_balance" DECIMAL(5,1) NOT NULL,
    "description" TEXT,
    "reference_id" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "leave_balance_ledger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "announcements" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "author_id" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "content" TEXT NOT NULL,
    "priority" VARCHAR(50) NOT NULL DEFAULT 'NORMAL',
    "is_pinned" BOOLEAN NOT NULL DEFAULT false,
    "published_at" TIMESTAMPTZ,
    "expires_at" TIMESTAMPTZ,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "announcements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kudos" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "sender_id" UUID NOT NULL,
    "recipient_employee_id" UUID NOT NULL,
    "message" TEXT NOT NULL,
    "category" VARCHAR(50) NOT NULL,
    "is_public" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "kudos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "surveys" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "created_by" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "type" VARCHAR(50) NOT NULL,
    "status" VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
    "is_anonymous" BOOLEAN NOT NULL DEFAULT true,
    "questions" JSONB NOT NULL,
    "schedule_type" VARCHAR(50),
    "recurring_interval" VARCHAR(50),
    "start_date" TIMESTAMPTZ,
    "end_date" TIMESTAMPTZ,
    "target_audience" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "surveys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "survey_responses" (
    "id" UUID NOT NULL,
    "survey_id" UUID NOT NULL,
    "respondent_id" UUID NOT NULL,
    "answers" JSONB NOT NULL,
    "submitted_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "survey_responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "timesheets" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
    "week_start_date" DATE NOT NULL,
    "status" VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
    "submitted_at" TIMESTAMPTZ,
    "approved_by" UUID,
    "approved_at" TIMESTAMPTZ,
    "total_hours" DECIMAL(6,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "timesheets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "time_entries" (
    "id" UUID NOT NULL,
    "timesheet_id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "hours" DECIMAL(4,2) NOT NULL,
    "project_name" VARCHAR(255),
    "task_description" TEXT,
    "entry_type" VARCHAR(50) NOT NULL DEFAULT 'REGULAR',
    "is_billable" BOOLEAN NOT NULL DEFAULT false,
    "project_id" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "time_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "client_name" VARCHAR(255),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "budget_hours" DECIMAL(8,2),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contractors" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(20),
    "company_name" VARCHAR(255),
    "contract_type" VARCHAR(50) NOT NULL,
    "hourly_rate" DECIMAL(10,2),
    "start_date" DATE NOT NULL,
    "end_date" DATE,
    "status" VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    "tax_id" VARCHAR(100),
    "bank_details" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "contractors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contractor_invoices" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "contractor_id" UUID NOT NULL,
    "invoice_number" VARCHAR(50) NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "description" TEXT,
    "period_start" DATE NOT NULL,
    "period_end" DATE NOT NULL,
    "status" VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    "submitted_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approved_by" UUID,
    "paid_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "contractor_invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "geofence_zones" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "latitude" DECIMAL(10,8) NOT NULL,
    "longitude" DECIMAL(11,8) NOT NULL,
    "radius_meters" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "allowed_ip_ranges" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "geofence_zones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dashboard_configs" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "layout" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "dashboard_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "companies_company_code_key" ON "companies"("company_code");

-- CreateIndex
CREATE INDEX "companies_created_at_idx" ON "companies"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "users_supabase_auth_id_key" ON "users"("supabase_auth_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_google_id_key" ON "users"("google_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_employee_id_key" ON "users"("employee_id");

-- CreateIndex
CREATE INDEX "users_company_id_idx" ON "users"("company_id");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_supabase_auth_id_idx" ON "users"("supabase_auth_id");

-- CreateIndex
CREATE INDEX "users_created_at_idx" ON "users"("created_at");

-- CreateIndex
CREATE INDEX "users_is_active_idx" ON "users"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "users_company_id_email_key" ON "users"("company_id", "email");

-- CreateIndex
CREATE INDEX "departments_company_id_idx" ON "departments"("company_id");

-- CreateIndex
CREATE INDEX "departments_created_at_idx" ON "departments"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "departments_company_id_code_key" ON "departments"("company_id", "code");

-- CreateIndex
CREATE INDEX "designations_company_id_idx" ON "designations"("company_id");

-- CreateIndex
CREATE INDEX "designations_created_at_idx" ON "designations"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "designations_company_id_code_key" ON "designations"("company_id", "code");

-- CreateIndex
CREATE INDEX "employees_company_id_idx" ON "employees"("company_id");

-- CreateIndex
CREATE INDEX "employees_work_email_idx" ON "employees"("work_email");

-- CreateIndex
CREATE INDEX "employees_department_id_idx" ON "employees"("department_id");

-- CreateIndex
CREATE INDEX "employees_designation_id_idx" ON "employees"("designation_id");

-- CreateIndex
CREATE INDEX "employees_reporting_manager_id_idx" ON "employees"("reporting_manager_id");

-- CreateIndex
CREATE INDEX "employees_status_idx" ON "employees"("status");

-- CreateIndex
CREATE INDEX "employees_created_at_idx" ON "employees"("created_at");

-- CreateIndex
CREATE INDEX "employees_deleted_at_idx" ON "employees"("deleted_at");

-- CreateIndex
CREATE INDEX "employees_company_id_is_active_deleted_at_idx" ON "employees"("company_id", "is_active", "deleted_at");

-- CreateIndex
CREATE INDEX "employees_company_id_department_id_is_active_idx" ON "employees"("company_id", "department_id", "is_active");

-- CreateIndex
CREATE INDEX "employees_company_id_date_of_joining_date_of_leaving_idx" ON "employees"("company_id", "date_of_joining", "date_of_leaving");

-- CreateIndex
CREATE INDEX "employees_company_id_status_deleted_at_idx" ON "employees"("company_id", "status", "deleted_at");

-- CreateIndex
CREATE INDEX "employees_company_id_is_active_gender_idx" ON "employees"("company_id", "is_active", "gender");

-- CreateIndex
CREATE UNIQUE INDEX "employees_company_id_employee_code_key" ON "employees"("company_id", "employee_code");

-- CreateIndex
CREATE INDEX "attendance_company_id_idx" ON "attendance"("company_id");

-- CreateIndex
CREATE INDEX "attendance_employee_id_idx" ON "attendance"("employee_id");

-- CreateIndex
CREATE INDEX "attendance_attendance_date_idx" ON "attendance"("attendance_date");

-- CreateIndex
CREATE INDEX "attendance_company_id_attendance_date_status_idx" ON "attendance"("company_id", "attendance_date", "status");

-- CreateIndex
CREATE INDEX "attendance_company_id_employee_id_status_idx" ON "attendance"("company_id", "employee_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_company_id_employee_id_attendance_date_key" ON "attendance"("company_id", "employee_id", "attendance_date");

-- CreateIndex
CREATE INDEX "leaves_company_id_idx" ON "leaves"("company_id");

-- CreateIndex
CREATE INDEX "leaves_employee_id_idx" ON "leaves"("employee_id");

-- CreateIndex
CREATE INDEX "leaves_status_idx" ON "leaves"("status");

-- CreateIndex
CREATE INDEX "leaves_start_date_idx" ON "leaves"("start_date");

-- CreateIndex
CREATE INDEX "leaves_created_at_idx" ON "leaves"("created_at");

-- CreateIndex
CREATE INDEX "leaves_company_id_status_created_at_idx" ON "leaves"("company_id", "status", "created_at");

-- CreateIndex
CREATE INDEX "leaves_company_id_employee_id_status_idx" ON "leaves"("company_id", "employee_id", "status");

-- CreateIndex
CREATE INDEX "leaves_company_id_employee_id_start_date_idx" ON "leaves"("company_id", "employee_id", "start_date");

-- CreateIndex
CREATE INDEX "payroll_company_id_idx" ON "payroll"("company_id");

-- CreateIndex
CREATE INDEX "payroll_employee_id_idx" ON "payroll"("employee_id");

-- CreateIndex
CREATE INDEX "payroll_status_idx" ON "payroll"("status");

-- CreateIndex
CREATE INDEX "payroll_created_at_idx" ON "payroll"("created_at");

-- CreateIndex
CREATE INDEX "payroll_pay_period_year_pay_period_month_idx" ON "payroll"("pay_period_year", "pay_period_month");

-- CreateIndex
CREATE INDEX "payroll_batch_id_idx" ON "payroll"("batch_id");

-- CreateIndex
CREATE INDEX "payroll_company_id_is_bonus_pay_period_year_pay_period_mont_idx" ON "payroll"("company_id", "is_bonus", "pay_period_year", "pay_period_month");

-- CreateIndex
CREATE INDEX "payroll_company_id_employee_id_status_idx" ON "payroll"("company_id", "employee_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "payroll_company_id_employee_id_pay_period_month_pay_period__key" ON "payroll"("company_id", "employee_id", "pay_period_month", "pay_period_year");

-- CreateIndex
CREATE INDEX "salary_structures_company_id_idx" ON "salary_structures"("company_id");

-- CreateIndex
CREATE INDEX "salary_structures_designation_id_idx" ON "salary_structures"("designation_id");

-- CreateIndex
CREATE INDEX "payroll_batches_company_id_idx" ON "payroll_batches"("company_id");

-- CreateIndex
CREATE INDEX "payroll_batches_status_idx" ON "payroll_batches"("status");

-- CreateIndex
CREATE UNIQUE INDEX "payroll_batches_company_id_month_year_key" ON "payroll_batches"("company_id", "month", "year");

-- CreateIndex
CREATE INDEX "payroll_ytd_company_id_idx" ON "payroll_ytd"("company_id");

-- CreateIndex
CREATE INDEX "payroll_ytd_employee_id_idx" ON "payroll_ytd"("employee_id");

-- CreateIndex
CREATE INDEX "payroll_ytd_fiscal_year_idx" ON "payroll_ytd"("fiscal_year");

-- CreateIndex
CREATE UNIQUE INDEX "payroll_ytd_company_id_employee_id_fiscal_year_key" ON "payroll_ytd"("company_id", "employee_id", "fiscal_year");

-- CreateIndex
CREATE INDEX "tax_configurations_country_idx" ON "tax_configurations"("country");

-- CreateIndex
CREATE INDEX "tax_configurations_fiscal_year_idx" ON "tax_configurations"("fiscal_year");

-- CreateIndex
CREATE INDEX "tax_configurations_company_id_idx" ON "tax_configurations"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "tax_configurations_country_config_key_fiscal_year_key" ON "tax_configurations"("country", "config_key", "fiscal_year");

-- CreateIndex
CREATE INDEX "audit_logs_company_id_idx" ON "audit_logs"("company_id");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_resource_type_idx" ON "audit_logs"("resource_type");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- CreateIndex
CREATE INDEX "audit_logs_company_id_created_at_idx" ON "audit_logs"("company_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_company_id_resource_type_action_idx" ON "audit_logs"("company_id", "resource_type", "action");

-- CreateIndex
CREATE INDEX "notifications_company_id_idx" ON "notifications"("company_id");

-- CreateIndex
CREATE INDEX "notifications_user_id_idx" ON "notifications"("user_id");

-- CreateIndex
CREATE INDEX "notifications_is_read_idx" ON "notifications"("is_read");

-- CreateIndex
CREATE INDEX "notifications_created_at_idx" ON "notifications"("created_at");

-- CreateIndex
CREATE INDEX "notifications_user_id_company_id_is_read_created_at_idx" ON "notifications"("user_id", "company_id", "is_read", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "invitations_token_key" ON "invitations"("token");

-- CreateIndex
CREATE INDEX "invitations_company_id_idx" ON "invitations"("company_id");

-- CreateIndex
CREATE INDEX "invitations_email_idx" ON "invitations"("email");

-- CreateIndex
CREATE INDEX "invitations_token_idx" ON "invitations"("token");

-- CreateIndex
CREATE INDEX "invitations_status_idx" ON "invitations"("status");

-- CreateIndex
CREATE INDEX "documents_company_id_idx" ON "documents"("company_id");

-- CreateIndex
CREATE INDEX "documents_employee_id_idx" ON "documents"("employee_id");

-- CreateIndex
CREATE INDEX "documents_category_idx" ON "documents"("category");

-- CreateIndex
CREATE INDEX "workflow_templates_company_id_idx" ON "workflow_templates"("company_id");

-- CreateIndex
CREATE INDEX "workflow_templates_entity_type_idx" ON "workflow_templates"("entity_type");

-- CreateIndex
CREATE UNIQUE INDEX "workflow_templates_company_id_name_key" ON "workflow_templates"("company_id", "name");

-- CreateIndex
CREATE INDEX "workflow_instances_company_id_idx" ON "workflow_instances"("company_id");

-- CreateIndex
CREATE INDEX "workflow_instances_template_id_idx" ON "workflow_instances"("template_id");

-- CreateIndex
CREATE INDEX "workflow_instances_entity_type_entity_id_idx" ON "workflow_instances"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "workflow_instances_status_idx" ON "workflow_instances"("status");

-- CreateIndex
CREATE INDEX "workflow_instances_company_id_status_created_at_idx" ON "workflow_instances"("company_id", "status", "created_at");

-- CreateIndex
CREATE INDEX "workflow_instances_company_id_entity_type_status_idx" ON "workflow_instances"("company_id", "entity_type", "status");

-- CreateIndex
CREATE INDEX "workflow_steps_instance_id_idx" ON "workflow_steps"("instance_id");

-- CreateIndex
CREATE INDEX "workflow_steps_status_idx" ON "workflow_steps"("status");

-- CreateIndex
CREATE INDEX "api_keys_company_id_idx" ON "api_keys"("company_id");

-- CreateIndex
CREATE INDEX "api_keys_key_hash_idx" ON "api_keys"("key_hash");

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_prefix_key" ON "api_keys"("prefix");

-- CreateIndex
CREATE INDEX "webhook_endpoints_company_id_idx" ON "webhook_endpoints"("company_id");

-- CreateIndex
CREATE INDEX "webhook_endpoints_is_active_idx" ON "webhook_endpoints"("is_active");

-- CreateIndex
CREATE INDEX "webhook_deliveries_endpoint_id_idx" ON "webhook_deliveries"("endpoint_id");

-- CreateIndex
CREATE INDEX "webhook_deliveries_status_idx" ON "webhook_deliveries"("status");

-- CreateIndex
CREATE INDEX "webhook_deliveries_event_type_idx" ON "webhook_deliveries"("event_type");

-- CreateIndex
CREATE INDEX "webhook_deliveries_created_at_idx" ON "webhook_deliveries"("created_at");

-- CreateIndex
CREATE INDEX "webhook_deliveries_status_next_retry_at_idx" ON "webhook_deliveries"("status", "next_retry_at");

-- CreateIndex
CREATE INDEX "webhook_deliveries_endpoint_id_created_at_idx" ON "webhook_deliveries"("endpoint_id", "created_at");

-- CreateIndex
CREATE INDEX "custom_field_definitions_company_id_idx" ON "custom_field_definitions"("company_id");

-- CreateIndex
CREATE INDEX "custom_field_definitions_entity_type_idx" ON "custom_field_definitions"("entity_type");

-- CreateIndex
CREATE UNIQUE INDEX "custom_field_definitions_company_id_entity_type_field_key_key" ON "custom_field_definitions"("company_id", "entity_type", "field_key");

-- CreateIndex
CREATE INDEX "custom_field_values_definition_id_idx" ON "custom_field_values"("definition_id");

-- CreateIndex
CREATE INDEX "custom_field_values_entity_id_idx" ON "custom_field_values"("entity_id");

-- CreateIndex
CREATE UNIQUE INDEX "custom_field_values_definition_id_entity_id_key" ON "custom_field_values"("definition_id", "entity_id");

-- CreateIndex
CREATE INDEX "review_cycles_company_id_idx" ON "review_cycles"("company_id");

-- CreateIndex
CREATE INDEX "review_cycles_status_idx" ON "review_cycles"("status");

-- CreateIndex
CREATE INDEX "performance_reviews_company_id_idx" ON "performance_reviews"("company_id");

-- CreateIndex
CREATE INDEX "performance_reviews_cycle_id_idx" ON "performance_reviews"("cycle_id");

-- CreateIndex
CREATE INDEX "performance_reviews_employee_id_idx" ON "performance_reviews"("employee_id");

-- CreateIndex
CREATE INDEX "performance_reviews_status_idx" ON "performance_reviews"("status");

-- CreateIndex
CREATE INDEX "performance_reviews_company_id_employee_id_status_idx" ON "performance_reviews"("company_id", "employee_id", "status");

-- CreateIndex
CREATE INDEX "performance_reviews_company_id_cycle_id_status_idx" ON "performance_reviews"("company_id", "cycle_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "performance_reviews_cycle_id_employee_id_key" ON "performance_reviews"("cycle_id", "employee_id");

-- CreateIndex
CREATE INDEX "goals_company_id_idx" ON "goals"("company_id");

-- CreateIndex
CREATE INDEX "goals_employee_id_idx" ON "goals"("employee_id");

-- CreateIndex
CREATE INDEX "goals_status_idx" ON "goals"("status");

-- CreateIndex
CREATE INDEX "goals_company_id_employee_id_status_idx" ON "goals"("company_id", "employee_id", "status");

-- CreateIndex
CREATE INDEX "job_postings_company_id_idx" ON "job_postings"("company_id");

-- CreateIndex
CREATE INDEX "job_postings_status_idx" ON "job_postings"("status");

-- CreateIndex
CREATE INDEX "job_postings_department_id_idx" ON "job_postings"("department_id");

-- CreateIndex
CREATE INDEX "applicants_company_id_idx" ON "applicants"("company_id");

-- CreateIndex
CREATE INDEX "applicants_job_posting_id_idx" ON "applicants"("job_posting_id");

-- CreateIndex
CREATE INDEX "applicants_stage_idx" ON "applicants"("stage");

-- CreateIndex
CREATE INDEX "applicants_email_idx" ON "applicants"("email");

-- CreateIndex
CREATE INDEX "applicants_company_id_stage_idx" ON "applicants"("company_id", "stage");

-- CreateIndex
CREATE INDEX "applicants_job_posting_id_stage_idx" ON "applicants"("job_posting_id", "stage");

-- CreateIndex
CREATE INDEX "interviews_company_id_idx" ON "interviews"("company_id");

-- CreateIndex
CREATE INDEX "interviews_applicant_id_idx" ON "interviews"("applicant_id");

-- CreateIndex
CREATE INDEX "interviews_scheduled_at_idx" ON "interviews"("scheduled_at");

-- CreateIndex
CREATE INDEX "training_courses_company_id_idx" ON "training_courses"("company_id");

-- CreateIndex
CREATE INDEX "training_courses_status_idx" ON "training_courses"("status");

-- CreateIndex
CREATE INDEX "training_courses_category_idx" ON "training_courses"("category");

-- CreateIndex
CREATE INDEX "training_enrollments_company_id_idx" ON "training_enrollments"("company_id");

-- CreateIndex
CREATE INDEX "training_enrollments_course_id_idx" ON "training_enrollments"("course_id");

-- CreateIndex
CREATE INDEX "training_enrollments_employee_id_idx" ON "training_enrollments"("employee_id");

-- CreateIndex
CREATE INDEX "training_enrollments_status_idx" ON "training_enrollments"("status");

-- CreateIndex
CREATE INDEX "training_enrollments_company_id_status_idx" ON "training_enrollments"("company_id", "status");

-- CreateIndex
CREATE INDEX "training_enrollments_course_id_status_idx" ON "training_enrollments"("course_id", "status");

-- CreateIndex
CREATE INDEX "training_enrollments_employee_id_company_id_status_idx" ON "training_enrollments"("employee_id", "company_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "training_enrollments_course_id_employee_id_key" ON "training_enrollments"("course_id", "employee_id");

-- CreateIndex
CREATE INDEX "assets_company_id_idx" ON "assets"("company_id");

-- CreateIndex
CREATE INDEX "assets_status_idx" ON "assets"("status");

-- CreateIndex
CREATE INDEX "assets_assigned_to_idx" ON "assets"("assigned_to");

-- CreateIndex
CREATE INDEX "assets_category_idx" ON "assets"("category");

-- CreateIndex
CREATE UNIQUE INDEX "assets_company_id_asset_code_key" ON "assets"("company_id", "asset_code");

-- CreateIndex
CREATE INDEX "asset_assignments_asset_id_idx" ON "asset_assignments"("asset_id");

-- CreateIndex
CREATE INDEX "asset_assignments_employee_id_idx" ON "asset_assignments"("employee_id");

-- CreateIndex
CREATE INDEX "expense_claims_company_id_idx" ON "expense_claims"("company_id");

-- CreateIndex
CREATE INDEX "expense_claims_employee_id_idx" ON "expense_claims"("employee_id");

-- CreateIndex
CREATE INDEX "expense_claims_status_idx" ON "expense_claims"("status");

-- CreateIndex
CREATE INDEX "expense_claims_expense_date_idx" ON "expense_claims"("expense_date");

-- CreateIndex
CREATE INDEX "expense_claims_company_id_status_created_at_idx" ON "expense_claims"("company_id", "status", "created_at");

-- CreateIndex
CREATE INDEX "expense_claims_company_id_employee_id_status_idx" ON "expense_claims"("company_id", "employee_id", "status");

-- CreateIndex
CREATE INDEX "expense_claims_company_id_employee_id_expense_date_idx" ON "expense_claims"("company_id", "employee_id", "expense_date");

-- CreateIndex
CREATE INDEX "shift_definitions_company_id_idx" ON "shift_definitions"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "shift_definitions_company_id_code_key" ON "shift_definitions"("company_id", "code");

-- CreateIndex
CREATE INDEX "shift_assignments_company_id_idx" ON "shift_assignments"("company_id");

-- CreateIndex
CREATE INDEX "shift_assignments_employee_id_idx" ON "shift_assignments"("employee_id");

-- CreateIndex
CREATE INDEX "shift_assignments_assignment_date_idx" ON "shift_assignments"("assignment_date");

-- CreateIndex
CREATE INDEX "shift_assignments_company_id_employee_id_assignment_date_idx" ON "shift_assignments"("company_id", "employee_id", "assignment_date");

-- CreateIndex
CREATE UNIQUE INDEX "shift_assignments_shift_id_employee_id_assignment_date_key" ON "shift_assignments"("shift_id", "employee_id", "assignment_date");

-- CreateIndex
CREATE INDEX "policies_company_id_idx" ON "policies"("company_id");

-- CreateIndex
CREATE INDEX "policies_status_idx" ON "policies"("status");

-- CreateIndex
CREATE INDEX "policies_category_idx" ON "policies"("category");

-- CreateIndex
CREATE INDEX "policies_company_id_status_is_active_idx" ON "policies"("company_id", "status", "is_active");

-- CreateIndex
CREATE INDEX "policy_acknowledgments_policy_id_idx" ON "policy_acknowledgments"("policy_id");

-- CreateIndex
CREATE INDEX "policy_acknowledgments_employee_id_idx" ON "policy_acknowledgments"("employee_id");

-- CreateIndex
CREATE UNIQUE INDEX "policy_acknowledgments_policy_id_employee_id_key" ON "policy_acknowledgments"("policy_id", "employee_id");

-- CreateIndex
CREATE UNIQUE INDEX "feature_addons_feature_key" ON "feature_addons"("feature");

-- CreateIndex
CREATE INDEX "feature_addons_feature_idx" ON "feature_addons"("feature");

-- CreateIndex
CREATE INDEX "feature_addons_is_active_idx" ON "feature_addons"("is_active");

-- CreateIndex
CREATE INDEX "company_addons_company_id_idx" ON "company_addons"("company_id");

-- CreateIndex
CREATE INDEX "company_addons_feature_addon_id_idx" ON "company_addons"("feature_addon_id");

-- CreateIndex
CREATE INDEX "company_addons_status_idx" ON "company_addons"("status");

-- CreateIndex
CREATE INDEX "company_addons_company_id_status_expires_at_idx" ON "company_addons"("company_id", "status", "expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "company_addons_company_id_feature_addon_id_key" ON "company_addons"("company_id", "feature_addon_id");

-- CreateIndex
CREATE INDEX "billing_plans_tier_idx" ON "billing_plans"("tier");

-- CreateIndex
CREATE INDEX "billing_plans_is_active_idx" ON "billing_plans"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "company_billings_company_id_key" ON "company_billings"("company_id");

-- CreateIndex
CREATE INDEX "company_billings_company_id_idx" ON "company_billings"("company_id");

-- CreateIndex
CREATE INDEX "company_billings_billing_plan_id_idx" ON "company_billings"("billing_plan_id");

-- CreateIndex
CREATE UNIQUE INDEX "billing_invoices_invoice_number_key" ON "billing_invoices"("invoice_number");

-- CreateIndex
CREATE INDEX "billing_invoices_company_billing_id_idx" ON "billing_invoices"("company_billing_id");

-- CreateIndex
CREATE INDEX "billing_invoices_status_idx" ON "billing_invoices"("status");

-- CreateIndex
CREATE INDEX "billing_invoices_invoice_number_idx" ON "billing_invoices"("invoice_number");

-- CreateIndex
CREATE INDEX "approval_delegations_company_id_idx" ON "approval_delegations"("company_id");

-- CreateIndex
CREATE INDEX "approval_delegations_delegate_id_idx" ON "approval_delegations"("delegate_id");

-- CreateIndex
CREATE INDEX "approval_delegations_is_active_idx" ON "approval_delegations"("is_active");

-- CreateIndex
CREATE INDEX "approval_delegations_company_id_delegate_id_is_active_start_idx" ON "approval_delegations"("company_id", "delegate_id", "is_active", "start_date", "end_date");

-- CreateIndex
CREATE UNIQUE INDEX "approval_delegations_delegator_id_start_date_end_date_key" ON "approval_delegations"("delegator_id", "start_date", "end_date");

-- CreateIndex
CREATE INDEX "offboarding_checklists_company_id_idx" ON "offboarding_checklists"("company_id");

-- CreateIndex
CREATE INDEX "offboarding_processes_company_id_idx" ON "offboarding_processes"("company_id");

-- CreateIndex
CREATE INDEX "offboarding_processes_employee_id_idx" ON "offboarding_processes"("employee_id");

-- CreateIndex
CREATE INDEX "offboarding_processes_status_idx" ON "offboarding_processes"("status");

-- CreateIndex
CREATE INDEX "offboarding_processes_company_id_status_created_at_idx" ON "offboarding_processes"("company_id", "status", "created_at");

-- CreateIndex
CREATE INDEX "offboarding_tasks_process_id_idx" ON "offboarding_tasks"("process_id");

-- CreateIndex
CREATE INDEX "offboarding_tasks_status_idx" ON "offboarding_tasks"("status");

-- CreateIndex
CREATE INDEX "leave_policies_company_id_idx" ON "leave_policies"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "leave_policies_company_id_leave_type_key" ON "leave_policies"("company_id", "leave_type");

-- CreateIndex
CREATE INDEX "leave_balances_company_id_idx" ON "leave_balances"("company_id");

-- CreateIndex
CREATE INDEX "leave_balances_employee_id_idx" ON "leave_balances"("employee_id");

-- CreateIndex
CREATE UNIQUE INDEX "leave_balances_company_id_employee_id_leave_type_fiscal_yea_key" ON "leave_balances"("company_id", "employee_id", "leave_type", "fiscal_year");

-- CreateIndex
CREATE INDEX "leave_balance_ledger_balance_id_idx" ON "leave_balance_ledger"("balance_id");

-- CreateIndex
CREATE INDEX "announcements_company_id_idx" ON "announcements"("company_id");

-- CreateIndex
CREATE INDEX "announcements_is_active_idx" ON "announcements"("is_active");

-- CreateIndex
CREATE INDEX "announcements_company_id_is_active_is_pinned_created_at_idx" ON "announcements"("company_id", "is_active", "is_pinned", "created_at");

-- CreateIndex
CREATE INDEX "kudos_company_id_idx" ON "kudos"("company_id");

-- CreateIndex
CREATE INDEX "kudos_recipient_employee_id_idx" ON "kudos"("recipient_employee_id");

-- CreateIndex
CREATE INDEX "kudos_company_id_is_public_created_at_idx" ON "kudos"("company_id", "is_public", "created_at");

-- CreateIndex
CREATE INDEX "surveys_company_id_idx" ON "surveys"("company_id");

-- CreateIndex
CREATE INDEX "surveys_status_idx" ON "surveys"("status");

-- CreateIndex
CREATE INDEX "surveys_company_id_status_created_at_idx" ON "surveys"("company_id", "status", "created_at");

-- CreateIndex
CREATE INDEX "survey_responses_survey_id_idx" ON "survey_responses"("survey_id");

-- CreateIndex
CREATE UNIQUE INDEX "survey_responses_survey_id_respondent_id_key" ON "survey_responses"("survey_id", "respondent_id");

-- CreateIndex
CREATE INDEX "timesheets_company_id_idx" ON "timesheets"("company_id");

-- CreateIndex
CREATE INDEX "timesheets_employee_id_idx" ON "timesheets"("employee_id");

-- CreateIndex
CREATE INDEX "timesheets_status_idx" ON "timesheets"("status");

-- CreateIndex
CREATE INDEX "timesheets_company_id_status_employee_id_idx" ON "timesheets"("company_id", "status", "employee_id");

-- CreateIndex
CREATE UNIQUE INDEX "timesheets_company_id_employee_id_week_start_date_key" ON "timesheets"("company_id", "employee_id", "week_start_date");

-- CreateIndex
CREATE INDEX "time_entries_timesheet_id_idx" ON "time_entries"("timesheet_id");

-- CreateIndex
CREATE INDEX "time_entries_date_idx" ON "time_entries"("date");

-- CreateIndex
CREATE INDEX "projects_company_id_idx" ON "projects"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "projects_company_id_code_key" ON "projects"("company_id", "code");

-- CreateIndex
CREATE INDEX "contractors_company_id_idx" ON "contractors"("company_id");

-- CreateIndex
CREATE INDEX "contractors_status_idx" ON "contractors"("status");

-- CreateIndex
CREATE INDEX "contractors_company_id_status_created_at_idx" ON "contractors"("company_id", "status", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "contractors_company_id_email_key" ON "contractors"("company_id", "email");

-- CreateIndex
CREATE INDEX "contractor_invoices_company_id_idx" ON "contractor_invoices"("company_id");

-- CreateIndex
CREATE INDEX "contractor_invoices_contractor_id_idx" ON "contractor_invoices"("contractor_id");

-- CreateIndex
CREATE INDEX "contractor_invoices_status_idx" ON "contractor_invoices"("status");

-- CreateIndex
CREATE INDEX "contractor_invoices_company_id_contractor_id_status_idx" ON "contractor_invoices"("company_id", "contractor_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "contractor_invoices_company_id_invoice_number_key" ON "contractor_invoices"("company_id", "invoice_number");

-- CreateIndex
CREATE INDEX "geofence_zones_company_id_idx" ON "geofence_zones"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "dashboard_configs_user_id_key" ON "dashboard_configs"("user_id");

-- CreateIndex
CREATE INDEX "dashboard_configs_company_id_idx" ON "dashboard_configs"("company_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departments" ADD CONSTRAINT "departments_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departments" ADD CONSTRAINT "departments_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "designations" ADD CONSTRAINT "designations_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_reporting_manager_id_fkey" FOREIGN KEY ("reporting_manager_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_designation_id_fkey" FOREIGN KEY ("designation_id") REFERENCES "designations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_salary_structure_id_fkey" FOREIGN KEY ("salary_structure_id") REFERENCES "salary_structures"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leaves" ADD CONSTRAINT "leaves_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leaves" ADD CONSTRAINT "leaves_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll" ADD CONSTRAINT "payroll_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll" ADD CONSTRAINT "payroll_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll" ADD CONSTRAINT "payroll_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "payroll_batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "salary_structures" ADD CONSTRAINT "salary_structures_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_batches" ADD CONSTRAINT "payroll_batches_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_ytd" ADD CONSTRAINT "payroll_ytd_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_ytd" ADD CONSTRAINT "payroll_ytd_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tax_configurations" ADD CONSTRAINT "tax_configurations_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_invited_by_fkey" FOREIGN KEY ("invited_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_templates" ADD CONSTRAINT "workflow_templates_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_instances" ADD CONSTRAINT "workflow_instances_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_instances" ADD CONSTRAINT "workflow_instances_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "workflow_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_instances" ADD CONSTRAINT "workflow_instances_initiated_by_fkey" FOREIGN KEY ("initiated_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_steps" ADD CONSTRAINT "workflow_steps_instance_id_fkey" FOREIGN KEY ("instance_id") REFERENCES "workflow_instances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_steps" ADD CONSTRAINT "workflow_steps_resolved_by_fkey" FOREIGN KEY ("resolved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webhook_endpoints" ADD CONSTRAINT "webhook_endpoints_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webhook_deliveries" ADD CONSTRAINT "webhook_deliveries_endpoint_id_fkey" FOREIGN KEY ("endpoint_id") REFERENCES "webhook_endpoints"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custom_field_definitions" ADD CONSTRAINT "custom_field_definitions_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custom_field_values" ADD CONSTRAINT "custom_field_values_definition_id_fkey" FOREIGN KEY ("definition_id") REFERENCES "custom_field_definitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_cycles" ADD CONSTRAINT "review_cycles_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "performance_reviews" ADD CONSTRAINT "performance_reviews_cycle_id_fkey" FOREIGN KEY ("cycle_id") REFERENCES "review_cycles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goals" ADD CONSTRAINT "goals_review_id_fkey" FOREIGN KEY ("review_id") REFERENCES "performance_reviews"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_postings" ADD CONSTRAINT "job_postings_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applicants" ADD CONSTRAINT "applicants_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applicants" ADD CONSTRAINT "applicants_job_posting_id_fkey" FOREIGN KEY ("job_posting_id") REFERENCES "job_postings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interviews" ADD CONSTRAINT "interviews_applicant_id_fkey" FOREIGN KEY ("applicant_id") REFERENCES "applicants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_courses" ADD CONSTRAINT "training_courses_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_enrollments" ADD CONSTRAINT "training_enrollments_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "training_courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_assignments" ADD CONSTRAINT "asset_assignments_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_claims" ADD CONSTRAINT "expense_claims_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shift_definitions" ADD CONSTRAINT "shift_definitions_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shift_assignments" ADD CONSTRAINT "shift_assignments_shift_id_fkey" FOREIGN KEY ("shift_id") REFERENCES "shift_definitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "policies" ADD CONSTRAINT "policies_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "policy_acknowledgments" ADD CONSTRAINT "policy_acknowledgments_policy_id_fkey" FOREIGN KEY ("policy_id") REFERENCES "policies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_addons" ADD CONSTRAINT "company_addons_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_addons" ADD CONSTRAINT "company_addons_feature_addon_id_fkey" FOREIGN KEY ("feature_addon_id") REFERENCES "feature_addons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_billings" ADD CONSTRAINT "company_billings_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_billings" ADD CONSTRAINT "company_billings_billing_plan_id_fkey" FOREIGN KEY ("billing_plan_id") REFERENCES "billing_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "billing_invoices" ADD CONSTRAINT "billing_invoices_company_billing_id_fkey" FOREIGN KEY ("company_billing_id") REFERENCES "company_billings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_delegations" ADD CONSTRAINT "approval_delegations_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_delegations" ADD CONSTRAINT "approval_delegations_delegator_id_fkey" FOREIGN KEY ("delegator_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_delegations" ADD CONSTRAINT "approval_delegations_delegate_id_fkey" FOREIGN KEY ("delegate_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offboarding_checklists" ADD CONSTRAINT "offboarding_checklists_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offboarding_processes" ADD CONSTRAINT "offboarding_processes_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offboarding_processes" ADD CONSTRAINT "offboarding_processes_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offboarding_tasks" ADD CONSTRAINT "offboarding_tasks_process_id_fkey" FOREIGN KEY ("process_id") REFERENCES "offboarding_processes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_policies" ADD CONSTRAINT "leave_policies_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_balances" ADD CONSTRAINT "leave_balances_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_balances" ADD CONSTRAINT "leave_balances_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_balance_ledger" ADD CONSTRAINT "leave_balance_ledger_balance_id_fkey" FOREIGN KEY ("balance_id") REFERENCES "leave_balances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kudos" ADD CONSTRAINT "kudos_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kudos" ADD CONSTRAINT "kudos_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kudos" ADD CONSTRAINT "kudos_recipient_employee_id_fkey" FOREIGN KEY ("recipient_employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "surveys" ADD CONSTRAINT "surveys_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "surveys" ADD CONSTRAINT "surveys_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "survey_responses" ADD CONSTRAINT "survey_responses_survey_id_fkey" FOREIGN KEY ("survey_id") REFERENCES "surveys"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "survey_responses" ADD CONSTRAINT "survey_responses_respondent_id_fkey" FOREIGN KEY ("respondent_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timesheets" ADD CONSTRAINT "timesheets_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timesheets" ADD CONSTRAINT "timesheets_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_timesheet_id_fkey" FOREIGN KEY ("timesheet_id") REFERENCES "timesheets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contractors" ADD CONSTRAINT "contractors_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contractor_invoices" ADD CONSTRAINT "contractor_invoices_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contractor_invoices" ADD CONSTRAINT "contractor_invoices_contractor_id_fkey" FOREIGN KEY ("contractor_id") REFERENCES "contractors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "geofence_zones" ADD CONSTRAINT "geofence_zones_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dashboard_configs" ADD CONSTRAINT "dashboard_configs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

