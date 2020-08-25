export const project = (client, projectId) => {
  return client.request(`project?projectId=${projectId}`, null, {
    method: 'GET',
    json: false,
  });
};

export const all = (client) => {
  return client.request('project/all', null, {
    method: 'GET',
    json: false,
  });
};

export const registerProject = (client) => ({
  all: all.bind(null, client),
  project: project.bind(null, client),
});
