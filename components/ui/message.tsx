type MessageProps = {
  searchParams?: {
    success?: string;
    error?: string;
  };
};

export function PageMessage({ searchParams }: MessageProps) {
  if (searchParams?.success) {
    return (
      <div
        role="status"
        className="mb-4 rounded-card border border-green-200 bg-green-50 px-4 py-3 text-13 font-medium text-green-700"
      >
        {messageText(searchParams.success)}
      </div>
    );
  }

  if (searchParams?.error) {
    return (
      <div
        role="alert"
        className="mb-4 rounded-card border border-red-200 bg-red-50 px-4 py-3 text-13 font-medium text-red-700"
      >
        {messageText(searchParams.error)}
      </div>
    );
  }

  return null;
}

function messageText(value: string) {
  const messages: Record<string, string> = {
    not_allowed: "This email is not allowed to access the studio site.",
    archived: "This account has been archived.",
    admin_required: "Admin access is required for that page.",
    student_required: "Student access is required for that page."
  };

  return messages[value] ?? value;
}
