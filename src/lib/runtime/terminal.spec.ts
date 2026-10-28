import { expect, test } from 'vitest';
import {
	MAX_FRAME_CHARS,
	MAX_INPUT_CHARS,
	TERMINAL_PATH,
	createTerminal,
	type TerminalSocket,
	type TerminalStatus
} from './terminal';

const TOKEN = 'pairing-token-abcdef0123456789';
const ENDPOINT = 'http://127.0.0.1:8649';

type FakeSocket = TerminalSocket & {
	readonly url: string;
	readonly protocols: string[];
	readonly sent: string[];
	closeCount: number;
	emitOpen(): void;
	emitMessage(data: unknown): void;
	emitError(): void;
	emitClose(code?: number, reason?: string): void;
};

function fakeFactory(): {
	factory: (url: string, protocols: string[]) => TerminalSocket;
	sockets: FakeSocket[];
} {
	const sockets: FakeSocket[] = [];
	function factory(url: string, protocols: string[]): TerminalSocket {
		const socket: FakeSocket = {
			url,
			protocols,
			sent: [],
			closeCount: 0,
			readyState: 0,
			onopen: null,
			onclose: null,
			onerror: null,
			onmessage: null,
			send(data: string) {
				socket.sent.push(data);
			},
			close() {
				socket.closeCount += 1;
				socket.readyState = 3;
			},
			emitOpen() {
				socket.readyState = 1;
				socket.onopen?.({});
			},
			emitMessage(data: unknown) {
				socket.onmessage?.({ data });
			},
			emitError() {
				socket.onerror?.({});
			},
			emitClose(code = 1000, reason = '') {
				socket.readyState = 3;
				socket.onclose?.({ code, reason });
			}
		};
		sockets.push(socket);
		return socket;
	}
	return { factory, sockets };
}

function harness(options: { token?: string; endpoint?: string } = {}) {
	const { factory, sockets } = fakeFactory();
	const statuses: Array<{ status: TerminalStatus; detail?: string }> = [];
	const chunks: string[] = [];
	const terminal = createTerminal({
		endpoint: options.endpoint ?? ENDPOINT,
		token: options.token ?? TOKEN,
		socketFactory: factory,
		onData: (chunk) => chunks.push(chunk),
		onStatus: (status, detail) => statuses.push({ status, detail })
	});
	return { terminal, sockets, statuses, chunks };
}

test('connects to /v1/terminal with the token only in the protocol field', () => {
	const { terminal, sockets, statuses } = harness();
	expect(sockets).toHaveLength(1);
	const socket = sockets[0];
	expect(socket.url).toBe(`http://127.0.0.1:8649${TERMINAL_PATH}`);
	expect(socket.url).not.toContain(TOKEN);
	expect(socket.url).not.toContain('token');
	expect(socket.protocols).toEqual([`bearer.${TOKEN}`]);
	expect(socket.protocols[0].startsWith('bearer.')).toBe(true);
	expect(statuses[0].status).toBe('connecting');
	socket.emitOpen();
	expect(statuses.at(-1)?.status).toBe('open');
	terminal.close();
});

test('bounds outbound input and keeps later input working', () => {
	const { terminal, sockets, statuses } = harness();
	const socket = sockets[0];
	socket.emitOpen();
	terminal.send('x'.repeat(MAX_INPUT_CHARS));
	terminal.send('x'.repeat(MAX_INPUT_CHARS + 1));
	expect(socket.sent).toHaveLength(1);
	expect(statuses.filter((entry) => entry.status === 'error')).toHaveLength(1);
	expect(statuses.at(-1)?.detail).toContain(String(MAX_INPUT_CHARS));
	terminal.close();
});

test('drops an oversized inbound frame and reports it', () => {
	const { terminal, sockets, statuses, chunks } = harness();
	const socket = sockets[0];
	socket.emitOpen();
	socket.emitMessage('a'.repeat(MAX_FRAME_CHARS));
	socket.emitMessage('a'.repeat(MAX_FRAME_CHARS + 1));
	socket.emitMessage('after');
	expect(chunks).toEqual(['a'.repeat(MAX_FRAME_CHARS), 'after']);
	expect(statuses.some((entry) => entry.status === 'error')).toBe(true);
	terminal.close();
});

test('rejects non-text frames instead of guessing', () => {
	const { terminal, sockets, statuses, chunks } = harness();
	const socket = sockets[0];
	socket.emitOpen();
	socket.emitMessage(new ArrayBuffer(4));
	expect(chunks).toEqual([]);
	expect(statuses.at(-1)?.status).toBe('error');
	terminal.close();
});

test('caps consecutive error callbacks', () => {
	const { terminal, sockets, statuses } = harness();
	const socket = sockets[0];
	for (let index = 0; index < 10; index += 1) socket.emitError();
	const errors = statuses.filter((entry) => entry.status === 'error');
	expect(errors).toHaveLength(3);
	terminal.close();
});

test('close is idempotent, removes handlers and stops sending', () => {
	const { terminal, sockets, statuses } = harness();
	const socket = sockets[0];
	socket.emitOpen();
	terminal.close();
	expect(socket.closeCount).toBe(1);
	expect(socket.onopen).toBeNull();
	expect(socket.onmessage).toBeNull();
	expect(socket.onerror).toBeNull();
	expect(socket.onclose).toBeNull();
	terminal.close();
	terminal.close();
	expect(socket.closeCount).toBe(1);
	const statusCount = statuses.length;
	socket.emitError();
	socket.emitMessage('late');
	terminal.send('late');
	expect(statuses).toHaveLength(statusCount);
	expect(socket.sent).toEqual([]);
});

test('ignores send and resize before the socket opens', () => {
	const { terminal, sockets } = harness();
	const socket = sockets[0];
	terminal.send('echo hi\n');
	terminal.resize(120, 40);
	expect(socket.sent).toEqual([]);
	socket.emitOpen();
	terminal.resize(120, 40);
	expect(socket.sent).toEqual([JSON.stringify({ type: 'resize', cols: 120, rows: 40 })]);
	terminal.resize(0, 40);
	terminal.resize(10_000, 40);
	terminal.resize(80, Number.NaN);
	expect(socket.sent).toHaveLength(1);
	terminal.close();
});

test('reports closed once with the bridge reason', () => {
	const { terminal, sockets, statuses } = harness();
	const socket = sockets[0];
	socket.emitOpen();
	socket.emitClose(4401, 'revoked');
	expect(statuses.at(-1)?.status).toBe('closed');
	expect(statuses.at(-1)?.detail).toContain('4401');
	expect(statuses.at(-1)?.detail).toContain('revoked');
	terminal.close();
	expect(statuses.filter((entry) => entry.status === 'closed')).toHaveLength(1);
});

test('a malformed token fails without opening a socket', () => {
	const { factory, sockets } = fakeFactory();
	const statuses: Array<{ status: TerminalStatus; detail?: string }> = [];
	const terminal = createTerminal({
		endpoint: ENDPOINT,
		token: 'short',
		socketFactory: factory,
		onData: () => {},
		onStatus: (status, detail) => statuses.push({ status, detail })
	});
	expect(sockets).toHaveLength(0);
	expect(statuses[0].status).toBe('error');
	terminal.close();
});

test('an invalid endpoint fails without opening a socket', () => {
	const { terminal, sockets, statuses } = harness({ endpoint: 'not a url' });
	expect(sockets).toHaveLength(0);
	expect(statuses[0].status).toBe('error');
	expect(statuses[0].detail).toBeTruthy();
	terminal.close();
});
