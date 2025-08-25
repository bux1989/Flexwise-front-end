/**
 * Transform interview + collections data into a structured schedule overview
 * Sources:
 * - variables['dbb33dce-f242-4fe9-8aa9-1712edef6c62']  // interview data
 * - collections['18b475b5-a69a-4000-8dfe-1cb5558734f5'].data  // school days cview
 * - collections['a2df9501-1d71-4d48-bfc2-9609d7e76dd6'].data  // window/course lookup
 *
 * Change log:
 * - Per-day cells: generic method text only (no contact names).
 * - Global authorizedContacts summary for bottom section.
 * - Support "Falls nicht möglich" (pickup_fallback) at the correct rank.
 */
export default function transformStudentSchedule(options) {
    const {
        variables: vars = typeof variables !== 'undefined' ? variables : {},
        collections: colls = typeof collections !== 'undefined' ? collections : {},
        lang = 'de',
        actions = { canEditWishes: false, canEditHeimweg: false }
    } = options || {};

    // 1) Interview data
    const interview = vars['dbb33dce-f242-4fe9-8aa9-1712edef6c62'] || {};
    const student = interview.student || {};
    const courseChoices = Array.isArray(interview.course_choices) ? interview.course_choices : [];
    const heimweg = interview.heimweg || {};

    // 2) Collections
    const daysRaw = colls['18b475b5-a69a-4000-8dfe-1cb5558734f5']?.data || [];
    const windows = colls['a2df9501-1d71-4d48-bfc2-9609d7e76dd6']?.data || [];

    // Helper to normalize strings
    const norm = (s) => (s || '').toString().trim().toLowerCase();

    // Filter days to student's school if present
    const daysFiltered = student.school_id
        ? daysRaw.filter(d => !d.school_id || d.school_id === student.school_id)
        : daysRaw.slice();

    // Fallback if empty
    let daysSource = daysFiltered.length ? daysFiltered : [
        { day_id: 2, day_number: 1, name_de: 'Montag',     name_en: 'Monday' },
        { day_id: 3, day_number: 2, name_de: 'Dienstag',   name_en: 'Tuesday' },
        { day_id: 4, day_number: 3, name_de: 'Mittwoch',   name_en: 'Wednesday' },
        { day_id: 5, day_number: 4, name_de: 'Donnerstag', name_en: 'Thursday' },
        { day_id: 6, day_number: 5, name_de: 'Freitag',    name_en: 'Friday' }
    ];

    // Sort and build mapping: any of {name_de, name_en} -> canonical German key (name_de)
    daysSource = daysSource.slice().sort((a, b) => (a.day_number || 0) - (b.day_number || 0));
    const nameToDeKey = {};
    for (const d of daysSource) {
        const de = d.name_de || '';
        const en = d.name_en || '';
        if (de) nameToDeKey[norm(de)] = de;
        if (en) nameToDeKey[norm(en)] = de;
    }

    // 3) Days list for UI (id stable; key=name_de; label localized)
    const days = daysSource.map(d => ({
        id: d.day_id ?? d.day_number ?? d.name_de ?? d.name_en ?? Math.random().toString(36).slice(2),
        key: d.name_de || '',
        label: lang === 'de' ? (d.name_de || '') : (d.name_en || d.name_de || '')
    }));

    // 4) Window lookup map (titles only)
    const windowLookup = {};
    for (const w of windows) {
        if (w?.window_id) {
            windowLookup[w.window_id] = { course_name: w.course_name || '—' };
        }
    }

    // 5) Group choices by day (map any incoming day string to cview's German key)
    const choicesByDay = {};
    for (const d of days) choicesByDay[d.key] = [];

    for (const choice of courseChoices) {
        const raw = choice?.day || '';
        const deKey = nameToDeKey[norm(raw)];
        if (deKey && choicesByDay[deKey]) choicesByDay[deKey].push(choice);
    }

    // Sort choices by rank
    for (const dayKey of Object.keys(choicesByDay)) {
        choicesByDay[dayKey].sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0));
    }

    // Extract fallback info per day
    const fallbackByDay = {};
    const fallbackRankByDay = {};
    for (const dayKey of Object.keys(choicesByDay)) {
        const list = choicesByDay[dayKey] || [];
        const first = list[0];
        // If explicit no_offer is selected as first row, fallback doesn't apply
        if (first && first.no_offer === true) continue;

        const fallbackItem = list.find(ch => ch && ch.pickup_fallback === true);
        if (fallbackItem) {
            fallbackByDay[dayKey] = true;
            // Prefer explicit rank, fallback to max rank in that day, otherwise 3
            const maxRank = Math.max(0, ...list.map(ch => ch?.rank ?? 0));
            fallbackRankByDay[dayKey] = Number.isFinite(fallbackItem.rank) && fallbackItem.rank > 0
                ? fallbackItem.rank
                : (maxRank || 3);
        }
    }

    // 6) Max wishes rows (must cover fallback rank too)
    let maxWishesRows = 1;
    for (const dayKey of Object.keys(choicesByDay)) {
        // Count real selections only (exclude fallback + exclude no_offer-only)
        const list = choicesByDay[dayKey] || [];
        const first = list[0];
        const real = (first && first.no_offer === true)
            ? 1 // show "Kein Modul" in row 1 when no_offer
            : list.filter(ch => ch?.window_id && ch.no_offer !== true && !ch.pickup_fallback).length;

        const fallbackRank = fallbackRankByDay[dayKey] || 0;
        maxWishesRows = Math.max(maxWishesRows, real, fallbackRank, 1);
    }

    // 7) Wishes by day (respect "no_offer" if first row; exclude fallback entries)
    const wishesByDay = {};
    for (const d of days) {
        const list = choicesByDay[d.key] || [];
        if (list.length && list[0].no_offer === true) {
            wishesByDay[d.key] = [
                { rank: 1, title: lang === 'de' ? 'Kein Modul' : 'No module' }
            ];
        } else {
            const realChoices = list.filter(ch => ch?.window_id && !ch.pickup_fallback);
            wishesByDay[d.key] = realChoices.map(ch => {
                const win = windowLookup[ch.window_id];
                const title = win?.course_name || '—';
                return { rank: ch.rank ?? 0, title };
            });
        }
    }

    // 8) Has module (controls time rule)
    const hasModule = {};
    for (const d of days) {
        const list = choicesByDay[d.key] || [];
        hasModule[d.key] = list.some(ch => ch.window_id != null && ch.no_offer !== true);
    }

    // 9) Pickup per day (generic, no names)
    const pickupByDay = {};
    const methodText = (methodId) => {
        const de = {
            goes_alone: 'geht allein nach Hause',
            authorized_pickup: 'wird abgeholt',
            public_transport: 'fährt mit öffentlichen Verkehrsmitteln nach Hause',
            school_bus: 'fährt mit dem Schulbus / Shuttle nach Hause',
            none: '—'
        };
        const en = {
            goes_alone: 'goes home alone',
            authorized_pickup: 'is picked up',
            public_transport: 'takes public transport home',
            school_bus: 'takes the school bus/shuttle home',
            none: '—'
        };
        const dict = lang === 'de' ? de : en;
        return dict[methodId] || dict.none;
    };

    // Contacts once, for the global list
    const contactsArr = Array.isArray(heimweg.contacts) ? heimweg.contacts : [];
    const contactMap = {};
    for (const c of contactsArr) {
        if (!c?.id) continue;
        const first = (c.first_name || '').trim();
        const last = (c.last_name || '').trim();
        const name = `${first} ${last}`.trim();
        if (name) contactMap[c.id] = name;
    }
    const authorizedIds = Array.isArray(heimweg.authorizedIds) ? heimweg.authorizedIds : [];
    const primaryId = heimweg.primaryContactId;

    for (const d of days) {
        const time = hasModule[d.key] ? '16:00' : '14:30';
        let method = heimweg.method || 'none';
        if (heimweg.method === 'varies_daily' && heimweg.byDay?.[d.key]) {
            method = heimweg.byDay[d.key].method || 'none';
        }
        const text = methodText(method); // GENERIC, NO NAMES
        const note = (heimweg.method === 'varies_daily' && heimweg.byDay?.[d.key]?.notes) ? heimweg.byDay[d.key].notes : '';
        pickupByDay[d.key] = { time, method, text, warning: '', note };
    }

    // 10) Global authorized contacts section
    const authorizedRows = authorizedIds
        .filter(id => !!contactMap[id])
        .map(id => ({ id, name: contactMap[id], isPrimary: id === primaryId }));

    const seen = new Set();
    const dedupedRows = [];
    for (const r of authorizedRows) {
        if (seen.has(r.id)) continue;
        seen.add(r.id);
        dedupedRows.push(r);
    }

    const namesList = dedupedRows.map(r =>
        r.isPrimary ? `${r.name} (${lang === 'de' ? 'Primär' : 'Primary'})` : r.name
    ).join(', ');

    const authorizedContacts = {
        rows: dedupedRows,
        names: namesList,
        warning: dedupedRows.length
            ? ''
            : (lang === 'de' ? 'Keine abholberechtigten Kontakte gesetzt' : 'No authorized contacts set')
    };

    return {
        lang,
        studentName: `${student.first_name || ''} ${student.last_name || ''}`.trim() || '—',
        studentId: student.student_id || '',
        days,
        maxWishesRows,
        wishesByDay,
        // New: fallback info for rendering "Falls nicht möglich" at the correct rank
        fallbackByDay,
        fallbackRankByDay,
        pickupByDay,
        authorizedContacts,
        actions
    };
}