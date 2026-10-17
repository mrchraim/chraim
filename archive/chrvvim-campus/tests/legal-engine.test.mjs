// ==========================================================================
// اختبارات محرّك «المكتبة القانونية» في CHRVVIM CAMPUS.
// يستورد legal-engine.js (ES module صافٍ) ويتحقّق من البحث والتصفية والإسناد،
// ومن أن المكتبة لا تختلق أي محتوى قانوني.
// التشغيل: node --test tests/
// ==========================================================================
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as E from '../web/assets/js/legal-engine.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const DATA = JSON.parse(fs.readFileSync(path.join(here, '..', 'web', 'data', 'legal-library.json'), 'utf8'));

test('legal-engine: يصدر الدوال الأساسية', () => {
  for (const fn of ['normalizeText', 'filterDocuments', 'deriveFacets', 'buildCitation', 'effectiveVerification', 'statusInfo', 'sourceById']) {
    assert.equal(typeof E[fn], 'function', 'ينقص: ' + fn);
  }
});

test('سلامة البنية: أنواع/مجالات/نطاقات/مصادر بلا وثائق مختلقة', () => {
  assert.ok(DATA.documentTypes.length >= 8);
  assert.ok(DATA.categories.length >= 8);
  assert.ok(DATA.jurisdictions.length >= 1);
  assert.ok(DATA.sources.length >= 3);
  assert.equal(DATA.documents.length, 22, '22 وثيقة أصيلة (غير مختلقة)');
  assert.equal(DATA.status, 'ready');
});

test('كل مصدر له id فريد وحالة تحقق صحيحة', () => {
  const ids = new Set();
  for (const s of DATA.sources) {
    assert.ok(s.id && !ids.has(s.id), 'id فريد: ' + s.id);
    ids.add(s.id);
    assert.ok(['verified', 'unverified', 'pending'].includes(s.verification));
  }
  assert.equal(DATA.sources.filter((s) => s.verification === 'verified').length, 3);
});

test('normalizeText: يوحّد الهمزات ويحذف التشكيل واللواحق اللاتينية', () => {
  assert.equal(E.normalizeText('أَحْمَد'), E.normalizeText('احمد'));
  assert.equal(E.normalizeText('إجراء'), E.normalizeText('اجراء'));
  assert.equal(E.normalizeText('مَدْرسة'), E.normalizeText('مدرسه'));
  assert.equal(E.normalizeText('Décret-loi'), E.normalizeText('decret loi'));
  assert.equal(E.normalizeText('  القانون   المدني  '), 'القانون المدني');
});

test('filterDocuments: تصفية حسب النوع/المجال/النطاق/السنة', () => {
  const data = { documents: [
    { id: 'd1', type: 'law', category: 'civil', jurisdiction: 'ma', title: { ar: 'قانون الالتزامات والعقود' }, date: '1913-08-12', verification: 'verified', sourceId: 'chamber_reps' },
    { id: 'd2', type: 'decree', category: 'tax', jurisdiction: 'ma', title: { ar: 'مرسوم ضريبي' }, date: '2020-01-01', verification: 'unverified', sourceId: 'sgg_bo' },
    { id: 'd3', type: 'law', category: 'tax', jurisdiction: 'other', title: { ar: 'قانون أجنبي' }, date: '1999-05-05', verification: 'pending', sourceId: '' },
  ] };
  assert.equal(E.filterDocuments(data, {}).length, 3);
  assert.equal(E.filterDocuments(data, { type: 'law' }).length, 2);
  assert.equal(E.filterDocuments(data, { category: 'tax' }).length, 2);
  assert.equal(E.filterDocuments(data, { jurisdiction: 'ma' }).length, 2);
  assert.equal(E.filterDocuments(data, { verification: 'unverified' }).length, 1);
  assert.equal(E.filterDocuments(data, { yearFrom: 2000 }).length, 1);
  assert.equal(E.filterDocuments(data, { yearTo: 1950 }).length, 1);
});

test('filterDocuments: بحث متعدّد الكلمات (AND) وغير حسّاس للتشكيل مع «ال»', () => {
  const data = { documents: [
    { id: 'd1', type: 'law', title: { ar: 'القانون المدني' }, tags: ['التزامات'] },
    { id: 'd2', type: 'law', title: { ar: 'القانون الجنائي' } },
  ] };
  assert.equal(E.filterDocuments(data, { q: 'القانون المدني' }).length, 1);
  assert.equal(E.filterDocuments(data, { q: 'القانون' }).length, 2);
  assert.equal(E.filterDocuments(data, { q: 'القانون الضريبي' }).length, 0);
  assert.equal(E.filterDocuments(data, { q: 'الالتزامات' }).length, 1, 'يتسامح مع «ال» التعريف');
  assert.equal(E.filterDocuments(data, { q: 'القانون المدنى' }).length, 1, 'ى = ي');
});

test('filterDocuments: الترتيب حسب التاريخ', () => {
  const data = { documents: [
    { id: 'a', date: '1990-01-01', title: { ar: 'أ' } },
    { id: 'b', date: '2020-01-01', title: { ar: 'ب' } },
  ] };
  assert.deepEqual(E.filterDocuments(data, { sort: 'date_desc' }).map((d) => d.id), ['b', 'a']);
  assert.deepEqual(E.filterDocuments(data, { sort: 'date_asc' }).map((d) => d.id), ['a', 'b']);
});

test('deriveFacets: يحسب العدّ والسنوات من البيانات الفعلية', () => {
  const docs = [
    { type: 'law', category: 'civil', jurisdiction: 'ma', verification: 'verified', date: '2000-01-01' },
    { type: 'law', category: 'tax', jurisdiction: 'ma', verification: 'unverified', date: '2010-01-01' },
    { type: 'decree', category: 'civil', jurisdiction: 'other', verification: 'pending', date: '1995-01-01' },
  ];
  const f = E.deriveFacets(null, docs);
  assert.equal(f.total, 3);
  assert.equal(f.type.law, 2);
  assert.equal(f.category.civil, 2);
  assert.equal(f.yearFrom, 1995);
  assert.equal(f.yearTo, 2010);
});

test('effectiveVerification: «متحقَّق» يتطلّب تحقّق الوثيقة والمصدر معاً', () => {
  assert.equal(E.effectiveVerification({ verification: 'verified' }, { verification: 'verified' }), 'verified');
  assert.equal(E.effectiveVerification({ verification: 'verified' }, { verification: 'unverified' }), 'unverified');
  assert.equal(E.effectiveVerification({ verification: 'unverified' }, { verification: 'verified' }), 'unverified');
  assert.equal(E.effectiveVerification({ verification: 'pending' }, { verification: 'verified' }), 'pending');
  assert.equal(E.effectiveVerification({ verification: 'pending' }, null), 'pending');
});

test('buildCitation: يستعمل الحقول الحقيقية فقط', () => {
  const cite = E.buildCitation({ reference: 'Loi n° 65-99', title: { fr: 'Code du travail' }, date: '2003-09-11' }, { name: { fr: 'Bulletin Officiel' } }, 'fr');
  assert.ok(cite.includes('Loi n° 65-99') && cite.includes('Code du travail') && cite.includes('2003') && cite.includes('Bulletin Officiel'));
  assert.equal(E.buildCitation({ title: { ar: 'بلا مرجع' } }, null, 'ar'), 'بلا مرجع');
});

test('statusInfo + البيانات الحقيقية: بحث أصيل يُرجع نتائج', () => {
  const st = E.statusInfo(DATA);
  assert.equal(st.documents, 22);
  assert.equal(st.hasData, true);
  assert.equal(st.verifiedSources, 3);
  assert.ok(E.filterDocuments(DATA, { q: 'القانون' }).length >= 1);
  assert.equal(E.filterDocuments(DATA, {}).length, DATA.documents.length);
});

test('sourceById: يعيد المصدر الصحيح أو null', () => {
  assert.equal(E.sourceById(DATA, 'chamber_reps')?.id, 'chamber_reps');
  assert.equal(E.sourceById(DATA, 'nope'), null);
});
