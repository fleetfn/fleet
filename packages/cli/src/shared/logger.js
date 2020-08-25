import ansiEscapes from 'ansi-escapes';
import chalk from 'chalk';
import ora from 'ora';

export function highlight(text) {
	return chalk.bold.underline(text);
}

export function cmd(text) {
	return `${chalk.gray('`')}${chalk.cyan(text)}${chalk.gray('`')}`;
}

export function createLogger({debug: debugEnabled = false} = {}) {
	function print(str) {
		process.stderr.write(str);
	}

	function log(str, color = chalk.grey) {
		print(`${color('>')} ${str}\n`);
	}

	function warn(str, slug) {
		log(chalk`{yellow.bold WARN!} ${str}`);
		if (slug !== null) {
			log(`More details: https://fleetfn.com/docs/${slug}`);
		}
	}

	function note(str) {
		log(chalk`{yellow.bold NOTE:} ${str}`, chalk.yellow);
	}

	function error(str, slug) {
		log(chalk`{red.bold Error!} ${str}`, chalk.red);
		if (slug !== null) {
			log(`More details: https://fleetfn.com/docs/${slug}`);
		}
	}

	function success(str) {
		print(`${chalk.cyan('> Success!')} ${str}\n`);
	}

	function spinner(message, delay = 300) {
		let spinnerOra;
		let running = false;

		const timmerId = setTimeout(() => {
			spinnerOra = ora(chalk.gray(message));
			spinnerOra.color = 'gray';
			spinnerOra.start();
			running = true;
		}, delay);

		const stop = () => {
			clearTimeout(timmerId);
			if (running) {
				spinnerOra.stop();
				process.stderr.write(ansiEscapes.eraseLines(1));
				running = false;
			}
		};

		return stop;
	}

	function debug(str) {
		if (debugEnabled) {
			log(
				`${chalk.bold('[debug]')} ${chalk.gray(
					`[${new Date().toISOString()}]`
				)} ${str}`
			);
		}
	}

	return {
		debug,
		error,
		log,
		note,
		print,
		spinner,
		success,
		warn,
	};
}
