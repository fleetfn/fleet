export const create = (client, data) => {
	return client.request('function/deployments/create', data);
};

export const files = (client, files) => {
	return Promise.all(
		files.map(({data, handler, functionId}) =>
			client.request(
				`function/deployments/files?handler=${handler}&functionId=${functionId}`,
				data,
				{
					headers: {'Content-Type': 'application/octet-stream'},
					json: false,
				}
			)
		)
	);
};

export const validate = (client, data) => {
	return client.request('function/deployments/finish', data);
};

export const registerDeploy = (client) => ({
	create: create.bind(null, client),
	files: files.bind(null, client),
	validate: validate.bind(null, client),
});
