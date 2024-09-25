import React, {useState, useEffect} from 'react';
import {Text, Box} from 'ink';
import {chromium} from 'playwright';
import {ProgressBar} from '@inkjs/ui';
import dns from 'dns';

type Json = {
	downloadSpeed: string | null;
	uploadSpeed: string | null;
	latency: string | null;
	connectionType: string | null;
	operator: string | null;
	serverName: string | null;
	date: string | null;
};

type Props = {
	json?: boolean;
};

const App = ({json: showJson}: Props) => {
	const [progress, setProgress] = useState<number>(0);
	const [download, setDownload] = useState<string>('');
	const [upload, setUpload] = useState<string>('');
	const [isComplete, setIsComplete] = useState<boolean>(false);
	const [isPreparing, setIsPreparing] = useState<boolean>(true);
	const [isInternet, setIsInternet] = useState<boolean>(true);
	const [json, setJson] = useState<Json | null>(null);

	useEffect(() => {
		const runTest = async () => {
			// Check for internet
			dns.lookup('bredbandskollen.se', err => {
				if (err) {
					setIsInternet(false);
					return;
				}
			});

			// Launch browser
			const browser = await chromium.launch({headless: true});

			const page = await browser.newPage();

			await page.goto('https://www.bredbandskollen.se/');
			await page.click('#onetrust-reject-all-handler');
			await page.click('#measure');

			setIsPreparing(false);
			const intervalId = setInterval(async () => {
				const downloadSpeed = await page.$eval(
					'#downloadSpeed',
					el => el.textContent,
				);
				const uploadSpeed = await page.$eval(
					'#uploadSpeed',
					el => el.textContent,
				);

				const progressBar = await page.$eval('#progressBar', el =>
					el.getAttribute('value'),
				);

				setDownload(downloadSpeed || '');
				setUpload(uploadSpeed || '');
				setProgress(Number(progressBar) || 0);

				const measureAgainButton = await page.$('text="Mät igen"');
				if (measureAgainButton) {
					setIsComplete(true);
					clearInterval(intervalId);
					if (showJson) {
						const json: Json = {
							downloadSpeed,
							uploadSpeed,
							latency: await page.$eval('#latency', el => el.textContent),
							connectionType: await page.$eval(
								'#connectionType',
								el => el.textContent,
							),
							operator: await page.$eval('#operator', el => el.textContent),
							serverName: await page.$eval('#serverName', el => el.textContent),
							date: await page.$eval('#testDate', el => el.textContent),
						};
						setJson(json);
					}
					await browser.close();
				}
			}, 100);
		};

		runTest();
	}, []);

	const color = isPreparing ? 'gray' : isComplete ? 'green' : 'magenta';

	return isInternet ? (
		<Box marginX={2} marginY={1}>
			{json ? (
				<Text>{JSON.stringify(json, null, 2)}</Text>
			) : (
				<Box flexDirection="column" gap={1}>
					{progress < 100 && (
						<Box width={33}>
							<ProgressBar value={progress} />
						</Box>
					)}
					<Box>
						<Box gap={1} width={16}>
							<Text bold color={color}>
								{download || '--.--'}
							</Text>
							<Text color={color} dimColor>
								Mbps
							</Text>
							<Text color={color}>↓</Text>
						</Box>
						<Text>/</Text>
						<Box gap={1} width={16} justifyContent="flex-end">
							<Text bold color={color}>
								{upload || '--.--'}
							</Text>
							<Text color={color} dimColor>
								Mbps
							</Text>
							<Text color={color}>↑</Text>
						</Box>
					</Box>
				</Box>
			)}
		</Box>
	) : (
		<Box marginX={2} marginY={1}>
			<Text color="red">No internet connection.</Text>
		</Box>
	);
};

export default App;
