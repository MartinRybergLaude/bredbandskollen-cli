#!/usr/bin/env -S node --no-warnings=ExperimentalWarning

import React from 'react';
import {render} from 'ink';
import meow from 'meow';
import App from './app.js';

const cli = meow(
	`
	Usage
	  $ bredbandskollen

	Options
		--json  JSON output

	Examples
	  $ bredbandskollen --json

`,
	{
		importMeta: import.meta,
		flags: {
			json: {
				type: 'boolean',
			},
		},
	},
);

render(<App json={cli.flags.json} />);
