export const saveLead = async (data: any) => {
  const response = await fetch('/api/leads', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to save lead');
  }

  return response.json();
};

export const getDiagnostics = async () => {
  const response = await fetch('/api/diagnosticos');
  if (!response.ok) throw new Error('Failed to fetch diagnostics');
  return response.json();
};

export const getDiagnosticBySlug = async (slug: string) => {
  const response = await fetch(`/api/diagnosticos/${slug}`);
  if (!response.ok) throw new Error('Failed to fetch diagnostic');
  return response.json();
};

export const saveDiagnostic = async (data: any) => {
  const response = await fetch('/api/diagnosticos', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to save diagnostic');
  return response.json();
};

export const deleteDiagnostic = async (id: string) => {
  const response = await fetch(`/api/diagnosticos/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete diagnostic');
  return response.json();
};
