import 'fake-indexeddb/auto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  deleteProjectCompletely,
  getProjectNotes,
  getProjectResourceNotes,
  getProjectTodos,
  saveResourceNote
} from '../project/storage';
import type { ProjectFile } from '../project/types';
import { ProjectNotesPanel } from './project-notes-panel';

function createPanelFixture(): void {
  document.body.innerHTML = `
    <aside id="notesPane">
      <h2 id="notesPanelTitle"></h2>
      <button id="closeNotesButton"></button>
      <section id="projectMemosView">
        <button id="projectMemoCreateButton"></button>
        <button id="projectMemoSelectionButton"></button>
        <button id="projectMemoDeleteSelectedButton"></button>
        <p id="projectMemoStatus"></p><div id="projectMemoList"></div>
      </section>
      <section id="projectTodosView">
        <button id="todoCreateOrCancelButton"></button>
        <button id="todoSelectionButton"></button>
        <button id="todoDeleteSelectedButton"></button>
        <form id="projectTodoForm"><input id="projectTodoInput"><button id="projectTodoSubmitButton"></button></form>
        <p id="projectTodoStatus"></p><ul id="projectTodoList"></ul>
      </section>
      <section id="resourceMemosView">
        <button id="resourceMemoCreateButton"></button>
        <div id="selectedResourcePrompt"><span id="selectedResourcePromptText"></span></div>
        <p id="resourceMemoStatus"></p><div id="resourceMemoList"></div>
        <details id="orphanNotesSection"><summary id="orphanNotesSummary"></summary><ul id="orphanNotesList"></ul></details>
      </section>
    </aside>
  `;
}

function submit(form: HTMLFormElement): void {
  form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
}

const createdProjects: string[] = [];

afterEach(async () => {
  await Promise.all(createdProjects.splice(0).map(id => deleteProjectCompletely(id)));
  document.body.replaceChildren();
});

describe('project notes panel', () => {
  it('creates multiple titled notes and supports confirmed multi-selection', async () => {
    createPanelFixture();
    const projectId = crypto.randomUUID();
    createdProjects.push(projectId);
    const onRequestDelete = vi.fn();
    const panel = new ProjectNotesPanel({
      getFiles: () => [],
      getProjectId: () => projectId,
      onNavigateToResource: () => undefined,
      onRequestDelete,
      onSaveState: () => undefined
    });
    await panel.loadProject(projectId);
    panel.show('general');

    document.querySelector<HTMLButtonElement>('#projectMemoCreateButton')!.click();
    const editor = document.querySelector<HTMLFormElement>('.memo-editor')!;
    editor.querySelector<HTMLInputElement>('[name="title"]')!.value = 'Palette';
    editor.querySelector<HTMLTextAreaElement>('[name="content"]')!.value = 'Warm stone';
    submit(editor);
    await vi.waitFor(async () => expect(await getProjectNotes(projectId)).toHaveLength(1));

    document.querySelector<HTMLButtonElement>('#projectMemoCreateButton')!.click();
    const secondEditor = document.querySelector<HTMLFormElement>('.memo-editor')!;
    secondEditor.querySelector<HTMLInputElement>('[name="title"]')!.value = 'References';
    secondEditor.querySelector<HTMLTextAreaElement>('[name="content"]')!.value = 'Cave studies';
    submit(secondEditor);
    await vi.waitFor(async () => expect(await getProjectNotes(projectId)).toHaveLength(2));

    document.querySelector<HTMLButtonElement>('#projectMemoSelectionButton')!.click();
    expect(document.querySelector<HTMLButtonElement>('#projectMemoCreateButton')!.textContent).toBe('Cancelar');
    const selection = document.querySelector<HTMLInputElement>('[aria-label="Seleccionar nota: Palette"]')!;
    selection.checked = true;
    selection.dispatchEvent(new Event('change', { bubbles: true }));
    document.querySelector<HTMLButtonElement>('#projectMemoDeleteSelectedButton')!.click();

    expect(onRequestDelete).toHaveBeenCalledWith('projectNotes', [expect.any(String)]);
  });

  it('keeps task creation separate from selection and persists completion state', async () => {
    createPanelFixture();
    const projectId = crypto.randomUUID();
    createdProjects.push(projectId);
    const onRequestDelete = vi.fn();
    const panel = new ProjectNotesPanel({
      getFiles: () => [],
      getProjectId: () => projectId,
      onNavigateToResource: () => undefined,
      onRequestDelete,
      onSaveState: () => undefined
    });
    await panel.loadProject(projectId);
    panel.show('todos');
    expect(document.querySelector<HTMLElement>('#projectTodosView')!.hidden).toBe(false);
    expect(document.querySelector<HTMLElement>('#projectMemosView')!.hidden).toBe(true);

    document.querySelector<HTMLInputElement>('#projectTodoInput')!.value = 'Review the palette';
    submit(document.querySelector<HTMLFormElement>('#projectTodoForm')!);
    await vi.waitFor(async () => expect(await getProjectTodos(projectId)).toHaveLength(1));

    const completion = document.querySelector<HTMLInputElement>('[aria-label^="Marcar tarea"]')!;
    completion.checked = true;
    completion.dispatchEvent(new Event('change', { bubbles: true }));
    await vi.waitFor(async () => expect((await getProjectTodos(projectId))[0].completed).toBe(true));

    document.querySelector<HTMLButtonElement>('#todoSelectionButton')!.click();
    expect(document.querySelector<HTMLButtonElement>('#todoCreateOrCancelButton')!.textContent).toBe('Cancelar');
    expect(document.querySelector<HTMLFormElement>('#projectTodoForm')!.hidden).toBe(true);
    const checkbox = document.querySelector<HTMLInputElement>('[aria-label="Seleccionar tarea: Review the palette"]')!;
    checkbox.checked = true;
    checkbox.dispatchEvent(new Event('change', { bubbles: true }));
    document.querySelector<HTMLButtonElement>('#todoDeleteSelectedButton')!.click();

    expect(onRequestDelete).toHaveBeenCalledWith('projectTodos', [expect.any(String)]);
    await panel.applyDelete('projectTodos', (onRequestDelete.mock.calls[0][1] as string[]));
    expect(await getProjectTodos(projectId)).toEqual([]);
  });

  it('creates a file note and navigates to its file without closing the panel', async () => {
    createPanelFixture();
    const projectId = crypto.randomUUID();
    createdProjects.push(projectId);
    const file: ProjectFile = {
      projectId,
      resourceId: 'resource-1',
      path: 'textures/wall.png',
      blob: new Blob(['image']),
      mimeType: 'image/png',
      kind: 'source'
    };
    const onNavigateToResource = vi.fn();
    const panel = new ProjectNotesPanel({
      getFiles: () => [file],
      getProjectId: () => projectId,
      onNavigateToResource,
      onRequestDelete: () => undefined,
      onSaveState: () => undefined
    });
    await panel.loadProject(projectId);
    panel.setSelectedResource(file);
    panel.show('resources');

    document.querySelector<HTMLButtonElement>('#resourceMemoCreateButton')!.click();
    const editor = document.querySelector<HTMLFormElement>('.memo-editor')!;
    editor.querySelector<HTMLInputElement>('[name="title"]')!.value = 'Lighting';
    editor.querySelector<HTMLTextAreaElement>('[name="content"]')!.value = 'Soft light';
    submit(editor);
    await vi.waitFor(async () => expect(await getProjectResourceNotes(projectId)).toHaveLength(1));

    document.querySelector<HTMLButtonElement>('.resource-note-file-open')!.click();

    expect(onNavigateToResource).toHaveBeenCalledWith(file.path);
    expect(document.querySelector<HTMLElement>('#resourceMemosView')!.hidden).toBe(false);
    expect(document.querySelector<HTMLElement>('.resource-note-metadata')!.textContent).toContain(file.path);
    expect(document.querySelector<HTMLElement>('.resource-note-metadata')!.textContent).toContain('5 B');
  });

  it('lists files with notes and offers creation only for the selected file', async () => {
    createPanelFixture();
    const projectId = crypto.randomUUID();
    createdProjects.push(projectId);
    const notedFile: ProjectFile = {
      projectId,
      resourceId: 'resource-2',
      path: 'materials/stone.png',
      blob: new Blob(['image']),
      mimeType: 'image/png',
      kind: 'source'
    };
    const selectedFile: ProjectFile = {
      projectId,
      resourceId: 'resource-3',
      path: 'materials/wood.png',
      blob: new Blob(['wood']),
      mimeType: 'image/png',
      kind: 'source'
    };
    const unrelatedFile: ProjectFile = {
      projectId,
      resourceId: 'materials/unused.png',
      path: 'materials/unused.png',
      blob: new Blob(['unused']),
      mimeType: 'image/png',
      kind: 'source'
    };
    await saveResourceNote({
      projectId,
      id: 'existing-note',
      resourceId: notedFile.resourceId!,
      lastKnownPath: notedFile.path,
      title: 'Stone',
      content: 'Stone texture',
      createdAt: 1,
      updatedAt: 1
    });
    const panel = new ProjectNotesPanel({
      getFiles: () => [notedFile, selectedFile, unrelatedFile],
      getProjectId: () => projectId,
      onNavigateToResource: () => undefined,
      onRequestDelete: () => undefined,
      onSaveState: () => undefined
    });
    await panel.loadProject(projectId);
    panel.setSelectedResource(selectedFile);
    panel.show('resources');

    expect(document.querySelectorAll('.resource-note-file')).toHaveLength(1);
    expect(document.querySelector('.resource-note-file-name')!.textContent).toBe('stone.png');
    expect(document.querySelector<HTMLElement>('#selectedResourcePrompt')!.hidden).toBe(false);
    expect(document.querySelector<HTMLElement>('#selectedResourcePromptText')!.textContent).toContain('wood.png');

    document.querySelector<HTMLButtonElement>('#resourceMemoCreateButton')!.click();
    const editor = document.querySelector<HTMLFormElement>('.memo-editor')!;
    editor.querySelector<HTMLInputElement>('[name="title"]')!.value = 'Material';
    editor.querySelector<HTMLTextAreaElement>('[name="content"]')!.value = 'Stone grain';
    submit(editor);

    await vi.waitFor(async () => {
      const notes = await getProjectResourceNotes(projectId);
      expect(notes).toHaveLength(2);
      expect(notes.some(note => note.resourceId === selectedFile.resourceId)).toBe(true);
    });
    expect(document.querySelectorAll('.resource-note-file')).toHaveLength(2);
    expect(document.body.textContent).not.toContain(unrelatedFile.path);
  });
});
