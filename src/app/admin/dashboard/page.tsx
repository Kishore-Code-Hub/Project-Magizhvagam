import React from 'react';
import { redirect } from 'next/navigation';
import { getAdminSession } from '@/lib/auth';
import { db } from '@/lib/db';
import AdminDashboardClient from '@/components/admin/AdminDashboardClient';

export const revalidate = 0;

export default async function AdminDashboardPage() {
  const session = await getAdminSession();
  if (!session) {
    redirect('/admin/login');
  }

  // Fetch metrics & data
  const profile = await db.profile.findFirst();
  const projects = await db.project.findMany({ orderBy: { order: 'asc' } });
  const skills = await db.skill.findMany({ orderBy: { order: 'asc' } });
  const messages = await db.message.findMany({ orderBy: { createdAt: 'desc' } });
  const auditLogs = await db.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 20 });

  return (
    <AdminDashboardClient
      session={session}
      profile={profile}
      projects={projects}
      skills={skills}
      messages={messages}
      auditLogs={auditLogs}
    />
  );
}
