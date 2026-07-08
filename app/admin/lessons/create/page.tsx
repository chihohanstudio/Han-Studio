import { redirect } from "next/navigation";

export default function CreateLessonSlotPage() {
  redirect("/admin/lessons?modal=single-slot");
}
