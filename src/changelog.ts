/**
 * Subnautica Support - Vortex support for Subnautica
 * Copyright (C) 2023 Tobey Blaber
 * 
 * This program is free software; you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the
 * Free Software Foundation; either version 3 of the License, or (at your
 * option) any later version.
 * 
 * This program is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License
 * for more details.
 * 
 * You should have received a copy of the GNU General Public License along with
 * this program; if not, see <https://www.gnu.org/licenses>.
 */
import changelogMd from '!!raw-loader!../CHANGELOG.md';
import { EXTENSION_ID } from './constants';
import { markdownToHtml, stripMarkdown } from './utils';
import { gte, lt, major, parse, valid } from 'semver';
import store2 from 'store2';
import { types } from 'vortex-api';
import { z } from 'zod';
import IExtensionApi = types.IExtensionApi;

export const store = store2.namespace(EXTENSION_ID).namespace('common-changelog').namespace('draft');

export const versionParser = z.object({
    version: z.string(),
    date: z.number().optional(),
});

export type Version = z.infer<typeof versionParser>;

export const displayParser = z.union([
    z.literal('new'),
    z.literal('important'),
    z.literal('never'),
]);

const LAST_USED = 'last-version-used';
const LAST_SEEN = 'last-changelog-seen';

export const parseChangelog = async (changelog = changelogMd) => {
    const lastUsed: Version = versionParser.safeParse(store(LAST_USED)).success
        ? store(LAST_USED)
        : { version: '0.0.0' };
    store(LAST_USED, lastUsed);
    const lastSeen: Version = versionParser.safeParse(store(LAST_SEEN)).success
        ? store(LAST_SEEN)
        : { version: '3.2.8', date: Date.parse('2023-02-12') };
    store(LAST_SEEN, lastSeen);

    const raw = changelog;
    const lines = raw.split('\n').map(line => line.trimEnd());
    const mapped = lines.map((value, index) => ({ line: index + 1, value }));

    const mappedReferences = mapped.filter(({ value }) =>
        value.trim().startsWith('[') &&
        value.trim().indexOf(']: ') > 1 &&
        value.trim().length > value.trim().indexOf(']: ') + 3);
    const references = mappedReferences.map(({ value }) => value);

    const headings = mapped.filter(({ value }) => value.trimStart().startsWith('#'));

    const title = {
        ...headings.find(({ value }) => value.trimStart().startsWith('# ')),
        html: (await markdownToHtml(headings.find(({ value }) => value.trimStart().startsWith('# '))?.value || '', references)),
    };

    const releases = await Promise.all(headings
        .filter(({ value }) => value.trimStart().startsWith('## '))
        .map(async release => {
            const notice = mapped
                .filter(({ line, value }) =>
                    line > release.line &&
                    line < (headings.find(({ line }) => line > release.line)?.line ?? lines.length) &&
                    !mappedReferences.map(({ line }) => line).includes(line) &&
                    value.trim());

            const changeGroups = await Promise.all(headings
                .filter(({ line, value }) =>
                    line > release.line &&
                    line < (headings.find(({ line, value }) => line > release.line && value.trimStart().startsWith('## '))?.line ?? lines.length) &&
                    value.trimStart().startsWith('### ') &&
                    ['changed', 'added', 'removed', 'fixed'].includes(value.toLowerCase().trimStart().slice(4).trim()))
                .map(async changeGroup => ({
                    ...changeGroup,
                    changes: await Promise.all(mapped
                        .filter(({ line, value }) =>
                            line > changeGroup.line &&
                            line < (headings.find(({ line }) => line > changeGroup.line)?.line ?? lines.length) &&
                            (value.trimStart().startsWith('- ') || value.trimStart().startsWith('* ')))
                        .map(async change => {
                            const sliced = change.value.trimStart().slice(2).trimStart();
                            const boldAsterisks = '**';
                            const boldUnderscores = '__';
                            const bold = sliced.startsWith(boldAsterisks)
                                ? boldAsterisks
                                : (sliced.startsWith(boldUnderscores)
                                    ? boldUnderscores
                                    : undefined);

                            if (bold) {
                                const boldEndIndex = sliced.indexOf(bold, bold.length);
                                const prefixSeparator = ':';
                                const prefixSeparatorIndex = sliced.indexOf(prefixSeparator, bold.length);

                                if (prefixSeparatorIndex === boldEndIndex + bold.length ||
                                    prefixSeparatorIndex === boldEndIndex - 1) {
                                    const prefix = sliced.slice(0, Math.max(prefixSeparatorIndex + prefixSeparator.length, boldEndIndex + bold.length));
                                    const strippedLowerCase = (await stripMarkdown(prefix)).toLowerCase();

                                    return {
                                        ...change,
                                        prefix,
                                        breaking:
                                            strippedLowerCase === 'breaking:' ||
                                            strippedLowerCase.endsWith('(breaking):')
                                    }
                                }
                            }

                            return {
                                ...change,
                                prefix: undefined,
                                breaking: false,
                            };
                        })),
                })));

            const version = valid(parse(await stripMarkdown(`${release.value.split(' - ')[0]?.trim().slice(3) ?? ''}\n\n${mappedReferences.map(({ value }) => value).join('\n')}`)));
            const date = Date.parse(release.value.split(' - ')[1]?.trim() ?? '');
            const seen = (version && gte(lastSeen.version, version)) || (lastSeen.date && lastSeen.date >= date);
            const important =
                (version && lastSeen.version && major(version) > major(lastSeen.version)) ||
                notice.length > 0 ||
                changeGroups.flatMap(({ changes }) => changes).some(({ breaking }) => breaking);

            const html = `
                <details${important && !seen
                    ? ' open'
                    : ''}>
                    <summary>${await markdownToHtml(release.value, references)} <span class="expand">🔻</span></summary>
                    ${notice ? await markdownToHtml(notice.map(({ value }) => value).join('\n'), references) : ''}
                    ${await markdownToHtml(changeGroups
                        .map(({ value, changes }) =>
                            `${value}\n\n${changes.map(({ value }) => value).join('\n')}`.trim())
                        .join('\n\n'), references)}
                </details>`

            return {
                ...release,
                version,
                date,
                seen,
                important,
                notice,
                changeGroups,
                html,
            }
        }));

    const ignored = mapped.filter(({ line }) =>
        title?.line !== line &&
        !mappedReferences.map(({ line }) => line).includes(line) &&
        !releases.flatMap(({ line, notice, changeGroups }) => [
            line,
            ...notice.map(({ line }) => line),
            ...changeGroups.flatMap(({ line, changes }) => [line, ...changes.map(({ line }) => line)]),
        ]).includes(line));

    const html = `${title.html}\n${((await Promise.all(releases.map(async ({ html }) => html))).join('\n'))}</div>`;

    return {
        raw,
        headings,
        title,
        releases,
        references: mappedReferences,
        ignored,
        html,
        shouldDisplay: html.indexOf('<details open>') > -1,
        updated: lt(lastUsed.version, releases[0]?.version ?? '0.0.0'),
    };
}

export const showChangelog = async (api: IExtensionApi, html: string, releases: Awaited<ReturnType<typeof parseChangelog>>['releases']) =>
    api.showDialog?.('info', 'Subnautica Support extension updated',
        {
            htmlText: `<div class="changelog-wrapper"><style>
.dialog-container {
    max-height: 69vh; /* nice */
}

.changelog-wrapper {
    white-space: normal;
}

details > summary {
  cursor: pointer;
  display: flex;
  background: #303030aa;
  padding-left: 1.5rem;
}

details > summary * {
  cursor: pointer;
}

details > :not(summary) {
  margin-left: 1.5rem;
}

details > summary .expand {
  color: transparent;
  text-shadow: 0 0 0 rgb(238, 238, 238);
  margin-left: auto;
  width: 54px;
  height: 54px;
  padding-left: 2.5px;
  font-size: 3em;
  rotate: 90deg;
}

details[open] > summary .expand {
  rotate: 0deg;
}</style>${html.replace("<details", "<details open")}</div>`,
        }, [{
            label: 'I understand', action: () => store(LAST_SEEN, {
                version: releases[0].version,
                date: releases[0].date,
            })
        }]);

export const validateChangelog = async (api: IExtensionApi) => {
    const { html, releases, shouldDisplay, updated } = await parseChangelog();

    if (updated) {
        store(LAST_USED, { version: releases[0].version, date: releases[0].date });

        api.sendNotification?.({
            type: 'success',
            title: 'Extension updated',
            message: 'Subnautica Support extension updated',
            actions: [{ title: 'Changelog', action: () => showChangelog(api, html, releases) }],
        });
    }

    if (!shouldDisplay) {
        return;
    }

    await showChangelog(api, html, releases);
}

export const migrateVersion = async (version: string) => {
    const lastUsed: Version = versionParser.safeParse(store(LAST_USED)).success
        ? store(LAST_USED)
        : { version: '0.0.0' };

    if (lt(lastUsed.version, version)) {
        store(LAST_USED, { version, date: lastUsed.date });
    }
}
