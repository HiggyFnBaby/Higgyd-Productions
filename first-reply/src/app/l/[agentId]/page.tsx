import { prisma } from "@/lib/prisma";
import { LeadForm } from "@/components/LeadForm";
import { notFound } from "next/navigation";

export default async function LeadCapturePage({ params }: { params: { agentId: string } }) {
  const agent = await prisma.agent.findUnique({ where: { id: params.agentId } });
  if (!agent) notFound();

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-4">
      <div>
        <h1 className="text-2xl font-bold">Get in touch with {agent.name}</h1>
        <p className="mt-1 text-sm text-slate-600">
          Send a message and you&apos;ll hear back instantly.
        </p>
      </div>
      <LeadForm agentId={agent.id} />
    </div>
  );
}
