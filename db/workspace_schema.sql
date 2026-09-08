-- Workspace database schema: contacts, projects, and tasks.
-- Replaces the Airtable-based contact/project/task trackers with a
-- Postgres schema (e.g. for a Supabase-backed workspace database).

-- Enable UUID extension if not already active
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Core Contacts / Clients Table
CREATE TABLE workspace_contacts (
    contact_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name TEXT NOT NULL,
    email TEXT UNIQUE,
    phone TEXT,
    company_name TEXT,
    status TEXT DEFAULT 'Lead',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Projects / Workflows Table
CREATE TABLE workspace_projects (
    project_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contact_id UUID REFERENCES workspace_contacts(contact_id) ON DELETE SET NULL,
    project_name TEXT NOT NULL,
    pipeline_stage TEXT NOT NULL,
    priority_level TEXT DEFAULT 'Medium',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Operational Tasks Table (Replacing Airtable Task Trackers)
CREATE TABLE workspace_tasks (
    task_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES workspace_projects(project_id) ON DELETE CASCADE,
    task_title TEXT NOT NULL,
    task_status TEXT DEFAULT 'To Do',
    due_date DATE,
    assigned_agent TEXT
);
