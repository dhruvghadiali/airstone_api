const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execSync } = require('node:child_process');

/**
 * Append only logging for the migration commands.
 *
 * `create_logger(file)` returns a logger writing to one file, so applying and
 * rolling back share scripts/migrations/history.log while the generator keeps
 * its own scripts/generator/generator.log.
 *
 * A run reads as a block: a header naming what ran and against which database,
 * one entry per file, and a footer with the outcome.
 *
 *   === 2026-08-15T06:50:12Z migrate | db=gestore@cluster0.mongodb.net |
 *       node=v22.22.2 | git=9af5275 | by=dhruv@macbook
 *   [2026-08-15T06:50:12Z] APPLY    001_backfill_defaults.js
 *       users.is_active: set on 2 of 2 document(s)
 *       OK in 143ms -> executed/2026-08-15T06-50-12Z__001_backfill_defaults.js
 *   --- 2026-08-15T06:50:13Z migrate | applied 1 migration(s) in 1.2s
 *
 * The database and the git revision are the two details worth having when a
 * migration is questioned weeks later: which data it touched, and which version
 * of the code did the touching. Anything a migration prints is captured into
 * its entry, so the counts it reports are part of the record rather than
 * scrollback.
 *
 * These files belong in git. On a host that rebuilds the working tree from git
 * each deploy they are lost with the rest of the filesystem, so treat a log
 * written there as console output that happens to persist until the next
 * deploy.
 */

// 2026-08-15T06:11:51.482Z -> 2026-08-15T06:11:51Z
const timestamp = () => new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');

const format_duration = (milliseconds) =>
  milliseconds < 1000
    ? `${milliseconds}ms`
    : `${(milliseconds / 1000).toFixed(1)}s`;

// Which code ran the migration. Absent outside a checkout, which is fine.
const git_revision = () => {
  try {
    return execSync('git rev-parse --short HEAD', {
      stdio: ['ignore', 'pipe', 'ignore'],
    })
      .toString()
      .trim();
  } catch {
    return null;
  }
};

/**
 * The context line for a run. `database` is passed in by the caller because
 * only it knows whether a connection was opened.
 */
const run_context = (database) =>
  [
    database && `db=${database}`,
    `node=${process.version}`,
    git_revision() && `git=${git_revision()}`,
    `by=${os.userInfo().username}@${os.hostname()}`,
  ]
    .filter(Boolean)
    .join(' | ');

const create_logger = (log_file) => {
  const append_lines = (lines) => {
    fs.mkdirSync(path.dirname(log_file), { recursive: true });
    fs.appendFileSync(log_file, `${lines.join('\n')}\n`, 'utf8');
  };

  /**
   * Starts an entry and begins collecting whatever the step prints. Every call
   * must be paired with finish_entry, which is what restores console.log.
   */
  const start_entry = (action, name) => {
    const captured = [];
    const original_log = console.log;

    console.log = (...args) => {
      captured.push(args.map(String).join(' ').trim());
      original_log(...args);
    };

    return {
      action,
      name,
      captured,
      started_at: Date.now(),
      restore: () => {
        console.log = original_log;
      },
    };
  };

  /**
   * Closes the entry, writes it, and returns how long the step took so the
   * caller can report the same number on the console.
   */
  const finish_entry = (entry, status, detail) => {
    entry.restore();

    const duration = Date.now() - entry.started_at;

    append_lines([
      `[${timestamp()}] ${entry.action.padEnd(8)} ${entry.name}`,
      ...entry.captured.filter(Boolean).map((line) => `    ${line}`),
      `    ${status} in ${format_duration(duration)}${detail ? ` -> ${detail}` : ''}`,
    ]);

    return duration;
  };

  const open_run = (command, database) => {
    append_lines([`=== ${timestamp()} ${command} | ${run_context(database)}`]);

    return { command, started_at: Date.now() };
  };

  const close_run = (run, outcome) => {
    append_lines([
      `--- ${timestamp()} ${run.command} | ${outcome} in ${format_duration(Date.now() - run.started_at)}`,
      '',
    ]);
  };

  return { log_file, open_run, close_run, start_entry, finish_entry };
};

module.exports = { create_logger, run_context, timestamp, format_duration };
