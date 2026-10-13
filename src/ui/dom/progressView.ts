import type { ProgressView } from '../../core/progress';
import { pl } from '../../data/pl';
import { createText } from './overlay';

/**
 * Parent's progress preview (US-03, FR-015): the current step and the weakest skills with mistake examples, or the
 * empty state. Renders a ProgressView and computes nothing; the examples show the child's answers to the adult only.
 * DESIGN-GAP (docs/design-gaps.md row 27): the kit has no progress view or empty state; plain headings and lists.
 * DESIGN-GAP (docs/design-gaps.md row 58): an example of a drawn task (a clock, blocks) is shown without its drawing.
 */
export const createProgressView = (view: ProgressView): HTMLElement => {
    const section = document.createElement('section');
    section.className = 'parent-progress';
    section.append(
        createText('h2', pl.settings.progressHeading),
        createText('p', pl.settings.currentStep(view.step.index, view.step.total, view.step.title)),
    );
    if (view.weakest.length === 0) {
        section.append(createText('p', pl.settings.empty, 'parent-progress-empty'));
        return section;
    }
    const heading = createText('p', pl.settings.weakestHeading, 'parent-progress-heading');
    heading.id = 'settings-panel-weakest';
    const list = document.createElement('ul');
    list.setAttribute('aria-labelledby', heading.id);
    for (const skill of view.weakest) {
        const item = document.createElement('li');
        item.append(createText('p', `${skill.title} (${pl.settings.mastery(skill.mastery, skill.max)})`, 'parent-progress-skill'));
        if (skill.examples.length > 0) {
            const examples = document.createElement('ul');
            examples.className = 'parent-progress-examples';
            for (const example of skill.examples) {
                const row = document.createElement('li');
                row.textContent = pl.settings.example(example.prompt, example.given, example.answer);
                examples.append(row);
            }
            item.append(examples);
        }
        list.append(item);
    }
    section.append(heading, list);
    return section;
};
