-- =====================================================
-- PROGRAMS MODULE SCHEMA - TWO TABLE APPROACH
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- ENUM TYPE
-- =====================================================

CREATE TYPE section_key_type AS ENUM (
    'introduction',
    'about',
    'modules',
    'approaches',
    'impact',
    'strategic_alignment',
    'conclusion',
    'header',
    'course_enrollment',
    'programs',
    'why',
    'cloud_kitchen',
    'agri_food',
    'inventions'
);
-- =====================================================
-- PROGRAMS TABLE (Main Metadata)
-- =====================================================

CREATE TABLE programs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    program_type TEXT,
    location TEXT,
    date DATE,
    status TEXT, 
    image_url TEXT,
    banner_url TEXT,
    short_description TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- PROGRAM_SECTIONS TABLE (Dynamic Content)
-- =====================================================

CREATE TABLE program_sections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
    section_key section_key_type NOT NULL,
    title TEXT,
    content TEXT,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Unique constraint
    CONSTRAINT unique_program_section UNIQUE(program_id, section_key)
);

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_programs_updated_at
BEFORE UPDATE ON programs
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_program_sections_updated_at
BEFORE UPDATE ON program_sections
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX idx_program_sections_program_id
ON program_sections(program_id);

CREATE INDEX idx_program_sections_display 
ON program_sections(program_id, display_order);

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE programs IS 'Stores program metadata and basic information';
COMMENT ON TABLE program_sections IS 'Stores section-wise content for each program';
COMMENT ON COLUMN program_sections.section_key IS 'Predefined section types controlled via ENUM';