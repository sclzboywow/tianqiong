import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { TaskCard } from "@/components/TaskCard";
import { getCurrentUserId } from "@/lib/session";
import { listTasks } from "@/game/taskEngine";

export default async function TasksPage() {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/register");

  const tasks = await listTasks();

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <SiteHeader />
      <main className="mx-auto max-w-5xl space-y-4 px-4 py-6">
        <h1 className="text-xl font-bold text-amber-400">任务大厅</h1>
        <div className="grid gap-3 sm:grid-cols-2">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
        {tasks.length === 0 && <p className="text-zinc-400">暂无可用任务，请运行 seed 脚本</p>}
      </main>
    </div>
  );
}
