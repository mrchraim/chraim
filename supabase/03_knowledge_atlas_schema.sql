-- Knowledge Atlas Schema (PostgreSQL/Supabase)
-- Status: design only — not deployed. Review before apply.
-- Tables: sources, institutions, resources, official_documents, crawl_logs

CREATE TABLE IF NOT EXISTS sources (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    domain TEXT NOT NULL UNIQUE,
    categories JSONB DEFAULT '[]',
    priority INT DEFAULT 2,
    allowed_crawl BOOLEAN DEFAULT TRUE,
    last_checked_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS institutions (
    id TEXT PRIMARY KEY,
    name_ar TEXT NOT NULL,
    name_fr TEXT,
    type TEXT CHECK (type IN ('ministry', 'university', 'faculty', 'aref', 'school', 'agency')),
    parent_id TEXT REFERENCES institutions(id),
    website_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS resources (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    original_title TEXT,
    description TEXT,
    source_id TEXT REFERENCES sources(id),
    publisher TEXT,
    original_url TEXT NOT NULL UNIQUE,
    canonical_url TEXT,
    resource_type TEXT CHECK (resource_type IN ('html', 'pdf', 'docx', 'xlsx', 'pptx', 'odt', 'txt', 'epub')),
    language VARCHAR(10) DEFAULT 'ar',
    file_format VARCHAR(20),
    file_size_bytes BIGINT,
    checksum_sha256 VARCHAR(64),
    license TEXT DEFAULT 'Official Public Access',
    attribution TEXT,
    education_level TEXT,
    academic_year VARCHAR(20),
    track_branch TEXT,
    subject TEXT,
    institution_id TEXT REFERENCES institutions(id),
    faculty_id TEXT,
    program_id TEXT,
    semester VARCHAR(10),
    publication_date DATE,
    discovered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_checked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    verification_status TEXT CHECK (verification_status IN ('unverified', 'verified', 'flagged', 'rejected')) DEFAULT 'unverified',
    download_status TEXT CHECK (download_status IN ('linked_only', 'downloaded', 'failed')) DEFAULT 'linked_only',
    index_status TEXT CHECK (index_status IN ('pending', 'indexed', 'failed')) DEFAULT 'pending',
    rights_status TEXT CHECK (rights_status IN ('public_domain', 'copyrighted_linked', 'open_license')) DEFAULT 'copyrighted_linked'
);

CREATE TABLE IF NOT EXISTS official_documents (
    id TEXT PRIMARY KEY,
    resource_id TEXT REFERENCES resources(id) ON DELETE CASCADE,
    document_title TEXT NOT NULL,
    document_number VARCHAR(100),
    document_date DATE,
    publication_date DATE,
    issuing_authority TEXT NOT NULL,
    document_type TEXT CHECK (document_type IN ('dahir', 'law', 'decree', 'decision', 'circular', 'official_gazette', 'announcement')),
    sector TEXT,
    official_source TEXT,
    original_url TEXT NOT NULL,
    local_file_path TEXT,
    language VARCHAR(10) DEFAULT 'ar',
    legal_status TEXT CHECK (legal_status IN ('active', 'amended', 'repealed', 'draft')) DEFAULT 'active',
    version VARCHAR(20) DEFAULT '1.0',
    legal_effective_date DATE,
    related_document_ids JSONB DEFAULT '[]',
    verification_date TIMESTAMP WITH TIME ZONE,
    license_status TEXT
);

CREATE TABLE IF NOT EXISTS crawl_logs (
    id SERIAL PRIMARY KEY,
    job_id TEXT NOT NULL,
    source_id TEXT REFERENCES sources(id),
    status TEXT,
    discovered_count INT DEFAULT 0,
    processed_count INT DEFAULT 0,
    errors_count INT DEFAULT 0,
    log_details TEXT,
    execution_time_ms BIGINT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);