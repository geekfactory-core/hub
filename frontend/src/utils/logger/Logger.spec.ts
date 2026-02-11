import {beforeEach, describe, expect, it, vi} from 'vitest';
import type {LogEntry} from './Logger';
import {defaultListener, Logger, safeSerializeLogEntry} from './Logger';

describe('Logger', () => {
    let logger: Logger;

    beforeEach(() => {
        logger = new Logger('TestLogger');
        vi.clearAllMocks();
    });

    describe('constructor', () => {
        it('should create logger with default prefix', () => {
            const defaultLogger = new Logger();
            defaultLogger.log('test');
            const messages = defaultLogger.getAllMessages();
            expect(messages[0].prefix).toBe('');
        });

        it('should create logger with custom prefix', () => {
            const customLogger = new Logger('Custom');
            customLogger.log('test');
            const messages = customLogger.getAllMessages();
            expect(messages[0].prefix).toBe('Custom');
        });

        it('should trim and join multiple prefix parts', () => {
            const customLogger = new Logger('  Part1  Part2  ');
            customLogger.log('test');
            const messages = customLogger.getAllMessages();
            expect(messages[0].prefix).toBe('Part1  Part2');
        });

        it('should accept custom maxMessages option', () => {
            const smallLogger = new Logger('Small', {maxMessages: 5});
            for (let i = 0; i < 10; i++) {
                smallLogger.log(`message ${i}`);
            }
            const messages = smallLogger.getAllMessages();
            expect(messages.length).toBe(5);
        });

        it('should use default maxMessages of 100000', () => {
            const defaultLogger = new Logger();
            expect(defaultLogger['storage'].maxMessages).toBe(100000);
        });
    });

    describe('logging methods', () => {
        it('should log debug messages', () => {
            logger.debug('debug message');
            const messages = logger.getAllMessages();
            expect(messages).toHaveLength(1);
            expect(messages[0].level).toBe('debug');
            expect(messages[0].message).toBe('debug message');
        });

        it('should log info messages', () => {
            logger.log('info message');
            const messages = logger.getAllMessages();
            expect(messages).toHaveLength(1);
            expect(messages[0].level).toBe('log');
            expect(messages[0].message).toBe('info message');
        });

        it('should log warn messages', () => {
            logger.warn('warn message');
            const messages = logger.getAllMessages();
            expect(messages).toHaveLength(1);
            expect(messages[0].level).toBe('warn');
            expect(messages[0].message).toBe('warn message');
        });

        it('should log error messages', () => {
            logger.error('error message');
            const messages = logger.getAllMessages();
            expect(messages).toHaveLength(1);
            expect(messages[0].level).toBe('error');
            expect(messages[0].message).toBe('error message');
        });

        it('should log messages with additional arguments', () => {
            const obj = {key: 'value'};
            const arr = [1, 2, 3];
            logger.log('message with args', obj, arr);
            const messages = logger.getAllMessages();
            expect(messages[0].args).toEqual([obj, arr]);
        });

        it('should include timestamp in log entries', () => {
            const before = Date.now();
            logger.log('test');
            const after = Date.now();
            const messages = logger.getAllMessages();
            expect(messages[0].timestampMillis).toBeGreaterThanOrEqual(before);
            expect(messages[0].timestampMillis).toBeLessThanOrEqual(after);
        });

        it('should include prefix in log entries', () => {
            logger.log('test');
            const messages = logger.getAllMessages();
            expect(messages[0].prefix).toBe('TestLogger');
        });

        it('should assign unique uid to each log entry', () => {
            logger.log('first');
            logger.log('second');
            logger.log('third');
            const messages = logger.getAllMessages();
            expect(messages[0].uid).toBe(1);
            expect(messages[1].uid).toBe(2);
            expect(messages[2].uid).toBe(3);
        });
    });

    describe('includeCallerLocation option', () => {
        it('should not include caller location by default', () => {
            logger.log('test');
            const messages = logger.getAllMessages();
            expect(messages[0].message).toBe('test');
        });

        it('should include caller location when option is enabled', () => {
            const loggerWithLocation = new Logger('Test', {includeCallerLocation: true});
            loggerWithLocation.log('test');
            const messages = loggerWithLocation.getAllMessages();
            expect(messages[0].message).toContain('test (');
            expect(messages[0].message).toContain('Logger.spec.ts');
        });
    });

    describe('storage management', () => {
        it('should store messages up to maxMessages limit', () => {
            const smallLogger = new Logger('Small', {maxMessages: 3});
            smallLogger.log('msg1');
            smallLogger.log('msg2');
            smallLogger.log('msg3');
            const messages = smallLogger.getAllMessages();
            expect(messages).toHaveLength(3);
        });

        it('should overwrite oldest messages when exceeding maxMessages', () => {
            const smallLogger = new Logger('Small', {maxMessages: 3});
            smallLogger.log('msg1');
            smallLogger.log('msg2');
            smallLogger.log('msg3');
            smallLogger.log('msg4');
            smallLogger.log('msg5');
            const messages = smallLogger.getAllMessages();
            expect(messages).toHaveLength(3);
            expect(messages[0].message).toBe('msg3');
            expect(messages[1].message).toBe('msg4');
            expect(messages[2].message).toBe('msg5');
        });

        it('should maintain correct order when circular buffer wraps', () => {
            const smallLogger = new Logger('Small', {maxMessages: 3});
            for (let i = 1; i <= 10; i++) {
                smallLogger.log(`msg${i}`);
            }
            const messages = smallLogger.getAllMessages();
            expect(messages).toHaveLength(3);
            expect(messages[0].message).toBe('msg8');
            expect(messages[1].message).toBe('msg9');
            expect(messages[2].message).toBe('msg10');
        });

        it('should clear all messages', () => {
            logger.log('msg1');
            logger.log('msg2');
            expect(logger.getAllMessages()).toHaveLength(2);
            logger.clear();
            expect(logger.getAllMessages()).toHaveLength(0);
        });

        it('should reset uid counter when clearing', () => {
            logger.log('msg1');
            logger.log('msg2');
            logger.clear();
            logger.log('msg3');
            const messages = logger.getAllMessages();
            expect(messages[0].uid).toBe(1);
        });
    });

    describe('createChild', () => {
        it('should create child logger with combined prefix', () => {
            const child = logger.createChild('Child');
            child.log('test');
            const messages = child.getAllMessages();
            expect(messages[0].prefix).toBe('TestLogger Child');
        });

        it('should share storage with parent', () => {
            const child = logger.createChild('Child');
            logger.log('parent message');
            child.log('child message');
            expect(logger.getAllMessages()).toHaveLength(2);
            expect(child.getAllMessages()).toHaveLength(2);
        });

        it('should share dispatcher with parent by default', () => {
            const listener = vi.fn();
            logger.addListener(listener);
            const child = logger.createChild('Child');
            child.log('test');
            expect(listener).toHaveBeenCalledTimes(1);
        });

        it('should create separate dispatcher when useSameDispatcher is false', () => {
            const parentListener = vi.fn();
            const childListener = vi.fn();
            logger.addListener(parentListener);
            const child = logger.createChild('Child', {useSameDispatcher: false});
            child.addListener(childListener);
            child.log('test');
            expect(parentListener).not.toHaveBeenCalled();
            expect(childListener).toHaveBeenCalledTimes(1);
        });

        it('should support nested child loggers', () => {
            const child = logger.createChild('Child');
            const grandchild = child.createChild('Grandchild');
            grandchild.log('test');
            const messages = grandchild.getAllMessages();
            expect(messages[0].prefix).toBe('TestLogger Child Grandchild');
        });

        it('should handle includeCallerLocation option in child logger', () => {
            const child = logger.createChild('Child', {includeCallerLocation: true});
            child.log('test');
            const messages = child.getAllMessages();
            expect(messages[0].message).toContain('test (');
            expect(messages[0].message).toContain('Logger.spec.ts');
        });

        it('should trim empty prefix parts', () => {
            const emptyLogger = new Logger('');
            const child = emptyLogger.createChild('Child');
            child.log('test');
            const messages = child.getAllMessages();
            expect(messages[0].prefix).toBe('Child');
        });
    });

    describe('listeners', () => {
        it('should add and trigger listener', () => {
            const listener = vi.fn();
            logger.addListener(listener);
            logger.log('test');
            expect(listener).toHaveBeenCalledTimes(1);
            expect(listener).toHaveBeenCalledWith(
                expect.objectContaining({
                    level: 'log',
                    message: 'test',
                    prefix: 'TestLogger'
                })
            );
        });

        it('should support multiple listeners', () => {
            const listener1 = vi.fn();
            const listener2 = vi.fn();
            logger.addListener(listener1);
            logger.addListener(listener2);
            logger.log('test');
            expect(listener1).toHaveBeenCalledTimes(1);
            expect(listener2).toHaveBeenCalledTimes(1);
        });

        it('should remove listener', () => {
            const listener = vi.fn();
            logger.addListener(listener);
            logger.log('test1');
            logger.removeListener(listener);
            logger.log('test2');
            expect(listener).toHaveBeenCalledTimes(1);
        });

        it('should not fail when removing non-existent listener', () => {
            const listener = vi.fn();
            expect(() => logger.removeListener(listener)).not.toThrow();
        });

        it('should catch and log listener errors', () => {
            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
            const errorListener = vi.fn(() => {
                throw new Error('Listener error');
            });
            const goodListener = vi.fn();
            logger.addListener(errorListener);
            logger.addListener(goodListener);
            logger.log('test');
            expect(consoleErrorSpy).toHaveBeenCalledWith('[LogDispatcher] Listener error:', {
                error: expect.any(Error)
            });
            expect(goodListener).toHaveBeenCalledTimes(1);
            consoleErrorSpy.mockRestore();
        });

        it('should not add duplicate listener', () => {
            const listener = vi.fn();
            logger.addListener(listener);
            logger.addListener(listener);
            logger.log('test');
            expect(listener).toHaveBeenCalledTimes(1);
        });
    });

    describe('toJSON', () => {
        it('should serialize all log entries', () => {
            logger.log('msg1');
            logger.warn('msg2');
            logger.error('msg3');
            const json = logger.toJSON();
            expect(json).toHaveLength(3);
            expect(json[0]).toMatchObject({
                level: 'log',
                message: 'msg1'
            });
        });

        it('should use custom serializer when provided', () => {
            logger.log('test');
            const serializer = (entry: LogEntry) => ({
                custom: entry.level,
                msg: entry.message
            });
            const json = logger.toJSON(serializer);
            expect(json[0]).toEqual({
                custom: 'log',
                msg: 'test'
            });
        });

        it('should return empty array when no messages', () => {
            const json = logger.toJSON();
            expect(json).toEqual([]);
        });
    });

    describe('safeSerializeLogEntry', () => {
        it('should serialize log entry safely', () => {
            logger.log('test', {key: 'value'}, [1, 2, 3]);
            const entries = logger.getAllMessages();
            const serialized = safeSerializeLogEntry(entries[0]);
            expect(serialized).toMatchObject({
                uid: expect.any(Number),
                timestamp: expect.any(Number),
                level: 'log',
                prefix: 'TestLogger',
                message: 'test',
                args: expect.any(Array)
            });
        });

        it('should handle complex objects in args', () => {
            const complexObj = {
                bigint: 123n,
                uint8: new Uint8Array([1, 2, 3]),
                map: new Map([['key', 'value']]),
                set: new Set([1, 2, 3])
            };
            logger.log('test', complexObj);
            const entries = logger.getAllMessages();
            const serialized = safeSerializeLogEntry(entries[0]);
            expect(serialized.args[0]).toContain('bigint');
            expect(serialized.args[0]).toContain('Uint8Array');
            expect(serialized.args[0]).toContain('Map');
            expect(serialized.args[0]).toContain('Set');
        });

        it('should handle circular references in args', () => {
            const circular: any = {a: 1};
            circular.self = circular;
            logger.log('test', circular);
            const entries = logger.getAllMessages();
            const serialized = safeSerializeLogEntry(entries[0]);
            expect(serialized.args[0]).toContain('Unserializable');
        });
    });

    describe('defaultListener', () => {
        beforeEach(() => {
            vi.spyOn(console, 'debug').mockImplementation(() => {});
            vi.spyOn(console, 'log').mockImplementation(() => {});
            vi.spyOn(console, 'warn').mockImplementation(() => {});
            vi.spyOn(console, 'error').mockImplementation(() => {});
        });

        it('should log debug messages to console.debug', () => {
            const entry: LogEntry = {
                uid: 1,
                level: 'debug',
                timestampMillis: Date.now(),
                prefix: 'Test',
                message: 'debug message',
                args: []
            };
            defaultListener(entry);
            expect(console.debug).toHaveBeenCalledWith(expect.stringMatching(/DEBUG.*Test.*debug message/));
        });

        it('should log info messages to console.log', () => {
            const entry: LogEntry = {
                uid: 1,
                level: 'log',
                timestampMillis: Date.now(),
                prefix: 'Test',
                message: 'log message',
                args: []
            };
            defaultListener(entry);
            expect(console.log).toHaveBeenCalledWith(expect.stringMatching(/LOG.*Test.*log message/));
        });

        it('should log warn messages to console.warn', () => {
            const entry: LogEntry = {
                uid: 1,
                level: 'warn',
                timestampMillis: Date.now(),
                prefix: 'Test',
                message: 'warn message',
                args: []
            };
            defaultListener(entry);
            expect(console.warn).toHaveBeenCalledWith(expect.stringMatching(/WARN.*Test.*warn message/));
        });

        it('should log error messages to console.error', () => {
            const entry: LogEntry = {
                uid: 1,
                level: 'error',
                timestampMillis: Date.now(),
                prefix: 'Test',
                message: 'error message',
                args: []
            };
            defaultListener(entry);
            expect(console.error).toHaveBeenCalledWith(expect.stringMatching(/ERROR.*Test.*error message/));
        });

        it('should include timestamp in ISO format', () => {
            const timestamp = Date.now();
            const entry: LogEntry = {
                uid: 1,
                level: 'log',
                timestampMillis: timestamp,
                prefix: 'Test',
                message: 'test',
                args: []
            };
            defaultListener(entry);
            const expectedDate = new Date(timestamp).toISOString();
            expect(console.log).toHaveBeenCalledWith(expect.stringContaining(expectedDate));
        });

        it('should pass additional arguments to console', () => {
            const obj = {key: 'value'};
            const arr = [1, 2, 3];
            const entry: LogEntry = {
                uid: 1,
                level: 'log',
                timestampMillis: Date.now(),
                prefix: 'Test',
                message: 'test',
                args: [obj, arr]
            };
            defaultListener(entry);
            expect(console.log).toHaveBeenCalledWith(expect.any(String), obj, arr);
        });
    });

    describe('edge cases', () => {
        it('should handle empty message', () => {
            logger.log('');
            const messages = logger.getAllMessages();
            expect(messages[0].message).toBe('');
        });

        it('should handle message with special characters', () => {
            const specialMessage = 'Test\n\t"quoted"\r\nline🚨';
            logger.log(specialMessage);
            const messages = logger.getAllMessages();
            expect(messages[0].message).toBe(specialMessage);
        });

        it('should handle null and undefined in args', () => {
            logger.log('test', null, undefined);
            const messages = logger.getAllMessages();
            expect(messages[0].args).toEqual([null, undefined]);
        });

        it('should handle very long messages', () => {
            const longMessage = 'a'.repeat(10000);
            logger.log(longMessage);
            const messages = logger.getAllMessages();
            expect(messages[0].message).toBe(longMessage);
        });

        it('should handle rapid sequential logging', () => {
            for (let i = 0; i < 1000; i++) {
                logger.log(`message ${i}`);
            }
            const messages = logger.getAllMessages();
            expect(messages).toHaveLength(1000);
            expect(messages[999].message).toBe('message 999');
        });
    });

    describe('integration scenarios', () => {
        it('should support parent-child listener propagation', () => {
            const parentListener = vi.fn();
            logger.addListener(parentListener);
            const child = logger.createChild('Child');
            logger.log('parent');
            child.log('child');
            expect(parentListener).toHaveBeenCalledTimes(2);
            const calls = parentListener.mock.calls;
            expect(calls[0][0].prefix).toBe('TestLogger');
            expect(calls[1][0].prefix).toBe('TestLogger Child');
        });

        it('should handle mixed log levels', () => {
            logger.debug('debug');
            logger.log('log');
            logger.warn('warn');
            logger.error('error');
            const messages = logger.getAllMessages();
            expect(messages).toHaveLength(4);
            expect(messages.map((m) => m.level)).toEqual(['debug', 'log', 'warn', 'error']);
        });

        it('should maintain separate storage across independent logger instances', () => {
            const logger1 = new Logger('Logger1');
            const logger2 = new Logger('Logger2');
            logger1.log('test1');
            logger2.log('test2');
            expect(logger1.getAllMessages()).toHaveLength(1);
            expect(logger2.getAllMessages()).toHaveLength(1);
            expect(logger1.getAllMessages()[0].message).toBe('test1');
            expect(logger2.getAllMessages()[0].message).toBe('test2');
        });

        it('should support clearing while maintaining listeners', () => {
            const listener = vi.fn();
            logger.addListener(listener);
            logger.log('before clear');
            logger.clear();
            logger.log('after clear');
            expect(listener).toHaveBeenCalledTimes(2);
            expect(logger.getAllMessages()).toHaveLength(1);
            expect(logger.getAllMessages()[0].message).toBe('after clear');
        });
    });
});
