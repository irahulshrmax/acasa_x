// lib/models/jobs/index.ts

import { db } from '@/lib/database';
import {
  Job,
  JobApplication,
  CreateJob,
  CreateJobApplication,
  JobFilters,
  JobApplicationFilters,
  JobStatistics,
} from '@/types/jobs';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const JOB_STATUS_ACTIVE = 1;
const JOB_STATUS_INACTIVE = 0;
const APPLICATION_STATUS_ACTIVE = 1;
const APPLICATION_STATUS_INACTIVE = 0;

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function getCurrentTimestamp(): string {
  return new Date().toISOString().slice(0, 19).replace('T', ' ');
}

export async function getJobs(filters: JobFilters = {}) {
  const knex = await db();
  const {
    type,
    city_name,
    status = JOB_STATUS_ACTIVE,
    keyword,
    page = DEFAULT_PAGE,
    limit = DEFAULT_LIMIT,
    sort_by = 'created_at_desc',
  } = filters;

  const query = knex('jobs');

  if (type) {
    query.where('type', 'like', `%${type}%`);
  }

  if (city_name) {
    query.where('city_name', 'like', `%${city_name}%`);
  }

  if (status !== undefined && status !== null) {
    query.where('status', status);
  }

  if (keyword) {
    query.where(function (this: any) {
      this.where('title', 'like', `%${keyword}%`)
        .orWhere('job_title', 'like', `%${keyword}%`)
        .orWhere('description', 'like', `%${keyword}%`)
        .orWhere('full_name', 'like', `%${keyword}%`)
        .orWhere('city_name', 'like', `%${keyword}%`);
    });
  }

  switch (sort_by) {
    case 'created_at_asc':
      query.orderBy('created_at', 'asc');
      break;
    case 'updated_at_desc':
      query.orderBy('updated_at', 'desc');
      break;
    case 'updated_at_asc':
      query.orderBy('updated_at', 'asc');
      break;
    case 'title_asc':
      query.orderBy('title', 'asc');
      break;
    case 'title_desc':
      query.orderBy('title', 'desc');
      break;
    case 'created_at_desc':
    default:
      query.orderBy('created_at', 'desc');
  }

  const countQuery = query.clone();
  const [{ total }] = await countQuery.count('* as total');

  const offset = (page - 1) * limit;
  const data = await query.limit(limit).offset(offset);

  return {
    data: data || [],
    meta: {
      total: Number(total) || 0,
      page,
      limit,
      totalPages: Math.ceil(Number(total) / limit) || 0,
    },
  };
}

export async function getJobById(id: number): Promise<Job | null> {
  const knex = await db();
  const job = await knex('jobs')
    .where('id', id)
    .first();

  return job || null;
}

export async function getJobBySlug(slug: string): Promise<Job | null> {
  const knex = await db();
  const job = await knex('jobs')
    .where('slug', slug)
    .where('status', JOB_STATUS_ACTIVE)
    .first();

  return job || null;
}

export async function getJobByTitle(title: string): Promise<Job | null> {
  const knex = await db();
  const job = await knex('jobs')
    .where('title', 'like', `%${title}%`)
    .where('status', JOB_STATUS_ACTIVE)
    .first();

  return job || null;
}

export async function createJob(data: CreateJob): Promise<Job> {
  const knex = await db();

  if (data.title) {
    const baseSlug = generateSlug(data.title);
    let slug = baseSlug;
    let counter = 1;
    
    let existing = await knex('jobs').where('slug', slug).first();
    while (existing) {
      slug = `${baseSlug}-${counter}`;
      existing = await knex('jobs').where('slug', slug).first();
      counter++;
    }
    data.slug = slug;
  }

  const now = getCurrentTimestamp();
  data.created_at = now;
  data.updated_at = now;

  if (data.status === undefined) {
    data.status = JOB_STATUS_ACTIVE;
  }

  const [id] = await knex('jobs').insert(data);

  const job = await getJobById(id);
  if (!job) {
    throw new Error('Failed to create job');
  }
  return job;
}

export async function updateJob(id: number, data: Partial<CreateJob>): Promise<Job | null> {
  const knex = await db();

  data.updated_at = getCurrentTimestamp();

  if (data.title && !data.slug) {
    const baseSlug = generateSlug(data.title);
    let slug = baseSlug;
    let counter = 1;
    
    let existing = await knex('jobs').where('slug', slug).whereNot('id', id).first();
    while (existing) {
      slug = `${baseSlug}-${counter}`;
      existing = await knex('jobs').where('slug', slug).whereNot('id', id).first();
      counter++;
    }
    data.slug = slug;
  }

  await knex('jobs')
    .where('id', id)
    .update(data);

  return getJobById(id);
}

export async function deleteJob(id: number): Promise<{ id: number; deleted: boolean }> {
  const knex = await db();
  await knex('jobs')
    .where('id', id)
    .update({
      status: JOB_STATUS_INACTIVE,
      updated_at: getCurrentTimestamp(),
    });

  return { id, deleted: true };
}

export async function permanentDeleteJob(id: number): Promise<{ id: number; deleted: boolean }> {
  const knex = await db();
  
  await knex('applyed_jobs')
    .where('job_id', id)
    .delete();
  
  await knex('jobs')
    .where('id', id)
    .delete();

  return { id, deleted: true };
}

export async function getFeaturedJobs(limit: number = 6): Promise<Job[]> {
  const knex = await db();
  const jobs = await knex('jobs')
    .where('status', JOB_STATUS_ACTIVE)
    .orderBy('created_at', 'desc')
    .limit(limit);

  return jobs || [];
}

export async function getJobApplications(filters: JobApplicationFilters = {}) {
  const knex = await db();
  const {
    job_id,
    status,
    email,
    phone,
    keyword,
    page = DEFAULT_PAGE,
    limit = DEFAULT_LIMIT,
    sort_by = 'apply_date_desc',
  } = filters;

  const query = knex('applyed_jobs as a');

  if (job_id) {
    query.where('a.job_id', job_id);
  }

  if (status !== undefined && status !== null) {
    query.where('a.status', status);
  }

  if (email) {
    query.where('a.email', 'like', `%${email}%`);
  }

  if (phone) {
    query.where('a.phone', 'like', `%${phone}%`);
  }

  if (keyword) {
    query.where(function (this: any) {
      this.where('a.first_name', 'like', `%${keyword}%`)
        .orWhere('a.last_name', 'like', `%${keyword}%`)
        .orWhere('a.email', 'like', `%${keyword}%`)
        .orWhere('a.current_last_employer', 'like', `%${keyword}%`)
        .orWhere('a.current_job_title', 'like', `%${keyword}%`);
    });
  }

  switch (sort_by) {
    case 'apply_date_asc':
      query.orderBy('a.apply_date', 'asc');
      break;
    case 'status':
      query.orderBy('a.status', 'asc');
      break;
    case 'apply_date_desc':
    default:
      query.orderBy('a.apply_date', 'desc');
  }

  const countQuery = query.clone();
  const [{ total }] = await countQuery.count('* as total');

  const offset = (page - 1) * limit;
  const data = await query.limit(limit).offset(offset);

  return {
    data: data || [],
    meta: {
      total: Number(total) || 0,
      page,
      limit,
      totalPages: Math.ceil(Number(total) / limit) || 0,
    },
  };
}

export async function getJobApplicationById(id: number): Promise<JobApplication | null> {
  const knex = await db();
  const application = await knex('applyed_jobs')
    .where('id', id)
    .first();

  return application || null;
}

export async function createJobApplication(data: CreateJobApplication): Promise<JobApplication> {
  const knex = await db();

  const job = await getJobById(data.job_id);
  if (!job) {
    throw new Error('Job not found');
  }
  if (job.status !== JOB_STATUS_ACTIVE) {
    throw new Error('Job is no longer active');
  }

  if (data.status === undefined) {
    data.status = APPLICATION_STATUS_ACTIVE;
  }

  const [id] = await knex('applyed_jobs').insert({
    first_name: data.first_name,
    last_name: data.last_name || null,
    email: data.email,
    phone: data.phone,
    message: data.message || data.cover_letter || null,
    resume: data.resume || data.resume_url || null,
    current_last_employer: data.current_last_employer || null,
    current_job_title: data.current_job_title || null,
    employment_status: data.employment_status || null,
    term: data.term || null,
    status: data.status,
    job_id: data.job_id,
    apply_date: new Date(),
    update_date: new Date(),
  });

  const application = await getJobApplicationById(id);
  if (!application) {
    throw new Error('Failed to create job application');
  }
  return application;
}

export async function updateJobApplicationStatus(
  id: number,
  status: number
): Promise<JobApplication | null> {
  const knex = await db();
  await knex('applyed_jobs')
    .where('id', id)
    .update({
      status,
      update_date: new Date(),
    });

  return getJobApplicationById(id);
}

export async function deleteJobApplication(id: number): Promise<{ id: number; deleted: boolean }> {
  const knex = await db();
  await knex('applyed_jobs')
    .where('id', id)
    .delete();

  return { id, deleted: true };
}

export async function getApplicationsByJob(jobId: number, filters: JobApplicationFilters = {}) {
  return getJobApplications({
    ...filters,
    job_id: jobId,
  });
}

export async function getApplicationsByEmail(email: string): Promise<JobApplication[]> {
  const knex = await db();
  const applications = await knex('applyed_jobs')
    .where('email', email)
    .orderBy('apply_date', 'desc');

  return applications || [];
}

export async function getJobStatistics(): Promise<JobStatistics> {
  const knex = await db();

  const [totalJobs] = await knex('jobs').count('* as total');
  const [activeJobs] = await knex('jobs')
    .where('status', JOB_STATUS_ACTIVE)
    .count('* as total');
  const [totalApplications] = await knex('applyed_jobs').count('* as total');

  const jobsByType = await knex('jobs')
    .select('type')
    .count('* as count')
    .whereNotNull('type')
    .groupBy('type');

  const jobsByCity = await knex('jobs')
    .select('city_name')
    .count('* as count')
    .whereNotNull('city_name')
    .groupBy('city_name');

  const applicationsByStatus = await knex('applyed_jobs')
    .select('status')
    .count('* as count')
    .groupBy('status');

  const recentApplications = await knex('applyed_jobs')
    .orderBy('apply_date', 'desc')
    .limit(10);

  const recentJobs = await knex('jobs')
    .where('status', JOB_STATUS_ACTIVE)
    .orderBy('created_at', 'desc')
    .limit(10);

  return {
    total_jobs: Number(totalJobs?.total || 0),
    active_jobs: Number(activeJobs?.total || 0),
    total_applications: Number(totalApplications?.total || 0),
    jobs_by_type: jobsByType.map((item: any) => ({ type: item.type || 'Other', count: Number(item.count) })),
    jobs_by_city: jobsByCity.map((item: any) => ({ city_name: item.city_name || 'Remote', count: Number(item.count) })),
    applications_by_status: applicationsByStatus.map((item: any) => ({ status: Number(item.status), count: Number(item.count) })),
    recent_applications: recentApplications || [],
    recent_jobs: recentJobs || [],
  };
}