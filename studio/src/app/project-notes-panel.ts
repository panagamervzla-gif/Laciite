import {
  deleteProjectNotes,
  deleteProjectTodos,
  deleteResourceNotes,
  getProjectNotes,
  getProjectResourceNotes,
  getProjectTodos,
  saveProjectNote,
  saveProjectTodo,
  saveResourceNote
} from '../project/storage';
import type { ProjectFile, ProjectNoteRecord, ProjectNotesBundle, ProjectTodoRecord, ResourceNoteRecord } from '../project/types';

export type NotesPanelScreen = 'general' | 'todos' | 'resources';
export type NotesDeletion = 'projectNotes' | 'projectTodos' | 'resourceNotes';

interface ProjectNotesPanelOptions {
  getFiles: () => ProjectFile[];
  getProjectId: () => string | undefined;
  onNavigateToResource: (path: string) => void;
  onRequestDelete: (kind: NotesDeletion, ids: string[]) => void;
  onSaveState: (message: string, error?: boolean) => void;
}

interface MemoDraft {
  kind: 'project' | 'resource';
  resourceId?: string;
  id?: string;
}

const screenTitles: Record<NotesPanelScreen, string> = {
  general: 'Notas generales',
  todos: 'Lista de tareas',
  resources: 'Notas del archivo'
};

function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} B`;
}

function resourceName(path: string): string {
  return path.split('/').at(-1) || path;
}

function isResourceNote(note: ProjectNoteRecord | ResourceNoteRecord): note is ResourceNoteRecord {
  return 'lastKnownPath' in note;
}

export class ProjectNotesPanel {
  private readonly root = document.querySelector<HTMLElement>('#notesPane')!;
  private readonly title = document.querySelector<HTMLElement>('#notesPanelTitle')!;
  private readonly projectMemoView = document.querySelector<HTMLElement>('#projectMemosView')!;
  private readonly projectMemoList = document.querySelector<HTMLElement>('#projectMemoList')!;
  private readonly projectMemoStatus = document.querySelector<HTMLElement>('#projectMemoStatus')!;
  private readonly projectMemoCreateButton = document.querySelector<HTMLButtonElement>('#projectMemoCreateButton')!;
  private readonly projectMemoSelectionButton = document.querySelector<HTMLButtonElement>('#projectMemoSelectionButton')!;
  private readonly projectMemoDeleteButton = document.querySelector<HTMLButtonElement>('#projectMemoDeleteSelectedButton')!;
  private readonly todoView = document.querySelector<HTMLElement>('#projectTodosView')!;
  private readonly todoForm = document.querySelector<HTMLFormElement>('#projectTodoForm')!;
  private readonly todoInput = document.querySelector<HTMLInputElement>('#projectTodoInput')!;
  private readonly todoSubmitButton = document.querySelector<HTMLButtonElement>('#projectTodoSubmitButton')!;
  private readonly todoList = document.querySelector<HTMLUListElement>('#projectTodoList')!;
  private readonly todoStatus = document.querySelector<HTMLElement>('#projectTodoStatus')!;
  private readonly todoCreateButton = document.querySelector<HTMLButtonElement>('#todoCreateOrCancelButton')!;
  private readonly todoSelectionButton = document.querySelector<HTMLButtonElement>('#todoSelectionButton')!;
  private readonly todoDeleteButton = document.querySelector<HTMLButtonElement>('#todoDeleteSelectedButton')!;
  private readonly resourceView = document.querySelector<HTMLElement>('#resourceMemosView')!;
  private readonly resourceList = document.querySelector<HTMLElement>('#resourceMemoList')!;
  private readonly resourceStatus = document.querySelector<HTMLElement>('#resourceMemoStatus')!;
  private readonly selectedResourcePrompt = document.querySelector<HTMLElement>('#selectedResourcePrompt')!;
  private readonly selectedResourcePromptText = document.querySelector<HTMLElement>('#selectedResourcePromptText')!;
  private readonly resourceCreateButton = document.querySelector<HTMLButtonElement>('#resourceMemoCreateButton')!;
  private readonly orphanNotesSection = document.querySelector<HTMLDetailsElement>('#orphanNotesSection')!;
  private readonly orphanNotesSummary = document.querySelector<HTMLElement>('#orphanNotesSummary')!;
  private readonly orphanNotesList = document.querySelector<HTMLUListElement>('#orphanNotesList')!;
  private readonly options: ProjectNotesPanelOptions;
  private projectNotes: ProjectNoteRecord[] = [];
  private todos: ProjectTodoRecord[] = [];
  private resourceNotes: ResourceNoteRecord[] = [];
  private selectedResource?: ProjectFile;
  private memoDraft?: MemoDraft;
  private expandedProjectNotes = new Set<string>();
  private expandedTodos = new Set<string>();
  private expandedResourceNotes = new Set<string>();
  private selectedProjectNotes = new Set<string>();
  private selectedTodos = new Set<string>();
  private selectingProjectNotes = false;
  private selectingTodos = false;
  private editingTodoId?: string;
  private busy = false;
  private lastFailure?: unknown;
  private writeQueue: Promise<void> = Promise.resolve();
  private dimensions = new WeakMap<Blob, string>();

  constructor(options: ProjectNotesPanelOptions) {
    this.options = options;
    this.projectMemoCreateButton.addEventListener('click', () => this.handleProjectMemoCreate());
    this.projectMemoSelectionButton.addEventListener('click', () => this.toggleProjectMemoSelection());
    this.projectMemoDeleteButton.addEventListener('click', () => this.requestDelete('projectNotes', this.selectedProjectNotes));
    this.todoCreateButton.addEventListener('click', () => this.handleTodoCreateOrCancel());
    this.todoSelectionButton.addEventListener('click', () => this.toggleTodoSelection());
    this.todoDeleteButton.addEventListener('click', () => this.requestDelete('projectTodos', this.selectedTodos));
    this.todoForm.addEventListener('submit', event => {
      event.preventDefault();
      void this.addTodo();
    });
    this.render();
  }

  async loadProject(projectId: string): Promise<void> {
    const [projectNotes, todos, resourceNotes] = await Promise.all([
      getProjectNotes(projectId),
      getProjectTodos(projectId),
      getProjectResourceNotes(projectId)
    ]);
    this.projectNotes = projectNotes;
    this.todos = todos;
    this.resourceNotes = resourceNotes;
    this.clearSelection();
    this.render();
  }

  reset(): void {
    this.projectNotes = [];
    this.todos = [];
    this.resourceNotes = [];
    this.selectedResource = undefined;
    this.memoDraft = undefined;
    this.editingTodoId = undefined;
    this.clearSelection();
    this.render();
  }

  show(screen?: NotesPanelScreen): void {
    this.title.textContent = screen ? screenTitles[screen] : '';
    this.projectMemoView.hidden = screen !== 'general';
    this.todoView.hidden = screen !== 'todos';
    this.resourceView.hidden = screen !== 'resources';
    this.render();
  }

  setSelectedResource(file?: ProjectFile): void {
    this.selectedResource = file;
    this.renderSelectedResourcePrompt();
    this.renderResources();
  }

  setFiles(files: ProjectFile[]): void {
    if (this.selectedResource?.resourceId) {
      this.selectedResource = files.find(file => file.resourceId === this.selectedResource?.resourceId);
    }
    const pathById = new Map(files.map(file => [file.resourceId, file.path]));
    this.resourceNotes = this.resourceNotes.map(note => ({
      ...note,
      lastKnownPath: pathById.get(note.resourceId) ?? note.lastKnownPath
    }));
    this.renderSelectedResourcePrompt();
    this.renderResources();
  }

  setBusy(busy: boolean): void {
    this.busy = busy;
    this.render();
  }

  getBundle(): ProjectNotesBundle {
    return {
      projectNotes: [...this.projectNotes],
      projectTodos: [...this.todos],
      resourceNotes: [...this.resourceNotes]
    };
  }

  async flush(): Promise<void> {
    await this.writeQueue;
    if (this.lastFailure) {
      const error = this.lastFailure;
      this.lastFailure = undefined;
      throw error;
    }
  }

  async applyDelete(kind: NotesDeletion, ids: string[]): Promise<void> {
    const projectId = this.options.getProjectId();
    if (!projectId) throw new Error('No hay un proyecto activo para eliminar sus notas o tareas.');
    if (kind === 'projectNotes') {
      await deleteProjectNotes(projectId, ids);
      this.projectNotes = this.projectNotes.filter(note => !ids.includes(note.id));
      for (const id of ids) this.expandedProjectNotes.delete(id);
      this.selectedProjectNotes.clear();
    } else if (kind === 'projectTodos') {
      await deleteProjectTodos(projectId, ids);
      this.todos = this.todos.filter(todo => !ids.includes(todo.id));
      this.selectedTodos.clear();
    } else {
      await deleteResourceNotes(projectId, ids);
      this.resourceNotes = this.resourceNotes.filter(note => !ids.includes(note.id));
    }
    this.clearSelectionMode(kind);
    this.render();
    this.options.onSaveState('Guardado local');
  }

  private clearSelection(): void {
    this.selectedProjectNotes.clear();
    this.selectedTodos.clear();
    this.selectingProjectNotes = false;
    this.selectingTodos = false;
  }

  private clearSelectionMode(kind: NotesDeletion): void {
    if (kind === 'projectNotes') this.selectingProjectNotes = false;
    else if (kind === 'projectTodos') this.selectingTodos = false;
  }

  private trackWrite(
    action: () => Promise<void>,
    success: () => void,
    status: HTMLElement,
    failureLabel: string,
    failure?: () => void
  ): void {
    this.writeQueue = this.writeQueue.then(async () => {
      status.textContent = 'Guardando…';
      status.classList.remove('error');
      try {
        await action();
        this.lastFailure = undefined;
        success();
        status.textContent = 'Guardado';
        this.options.onSaveState('Guardado local');
      } catch (error) {
        this.lastFailure = error;
        failure?.();
        status.textContent = error instanceof Error ? error.message : failureLabel;
        status.classList.add('error');
        this.options.onSaveState(failureLabel, true);
      }
    });
  }

  private requestDelete(kind: NotesDeletion, selection: Set<string>): void {
    if (this.busy || !selection.size) return;
    this.options.onRequestDelete(kind, [...selection]);
  }

  private startMemoDraft(draft: MemoDraft): void {
    if (this.busy) return;
    this.memoDraft = draft;
    this.render();
    this.projectMemoList.querySelector<HTMLInputElement>('.memo-editor input')?.focus();
    this.resourceList.querySelector<HTMLInputElement>('.memo-editor input')?.focus();
  }

  private handleProjectMemoCreate(): void {
    if (this.selectingProjectNotes) {
      this.selectingProjectNotes = false;
      this.selectedProjectNotes.clear();
      this.renderProjectNotes();
      return;
    }
    if (this.memoDraft?.kind === 'project') {
      this.memoDraft = undefined;
    } else {
      this.startMemoDraft({ kind: 'project' });
      return;
    }
    this.renderProjectNotes();
  }

  private toggleProjectMemoSelection(): void {
    this.selectingProjectNotes = !this.selectingProjectNotes;
    this.selectedProjectNotes.clear();
    if (this.selectingProjectNotes) this.memoDraft = undefined;
    this.renderProjectNotes();
  }

  private handleTodoCreateOrCancel(): void {
    if (this.selectingTodos) {
      this.selectingTodos = false;
      this.selectedTodos.clear();
      this.todoInput.disabled = false;
      this.todoForm.hidden = false;
      this.renderTodos();
      return;
    }
    this.todoInput.focus();
  }

  private toggleTodoSelection(): void {
    this.selectingTodos = !this.selectingTodos;
    this.selectedTodos.clear();
    if (this.selectingTodos) {
      this.editingTodoId = undefined;
      this.todoForm.hidden = true;
    } else {
      this.todoForm.hidden = false;
      this.todoInput.disabled = false;
    }
    this.renderTodos();
  }

  private saveMemo(form: HTMLFormElement, draft: MemoDraft): void {
    const projectId = this.options.getProjectId();
    if (!projectId) return;
    const title = new FormData(form).get('title')?.toString().trim() ?? '';
    const content = new FormData(form).get('content')?.toString() ?? '';
    if (!title) {
      form.querySelector<HTMLInputElement>('[name="title"]')?.focus();
      return;
    }
    const existing = draft.id
      ? draft.kind === 'project'
        ? this.projectNotes.find(note => note.id === draft.id)
        : this.resourceNotes.find(note => note.id === draft.id)
      : undefined;
    const now = Date.now();
    if (draft.kind === 'project') {
      const note: ProjectNoteRecord = {
          projectId,
          id: existing?.id ?? crypto.randomUUID(),
          title,
          content,
          createdAt: existing?.createdAt ?? now,
          updatedAt: now
      };
      this.trackWrite(
        () => saveProjectNote(note),
        () => {
          this.projectNotes = existing
            ? this.projectNotes.map(item => item.id === note.id ? note : item)
            : [...this.projectNotes, note];
          this.expandedProjectNotes.add(note.id);
          this.memoDraft = undefined;
          this.render();
        },
        this.projectMemoStatus,
        'No se pudo guardar la nota'
      );
      return;
    }
    const existingResourceNote = existing && isResourceNote(existing) ? existing : undefined;
    const note: ResourceNoteRecord = {
          projectId,
          id: existingResourceNote?.id ?? crypto.randomUUID(),
          resourceId: draft.resourceId ?? '',
          lastKnownPath: this.options.getFiles().find(file => file.resourceId === draft.resourceId)?.path ?? existingResourceNote?.lastKnownPath ?? '',
          title,
          content,
          createdAt: existingResourceNote?.createdAt ?? now,
          updatedAt: now
    };
    if (!note.resourceId) return;
    this.trackWrite(
      () => saveResourceNote(note),
      () => {
        this.resourceNotes = existingResourceNote
          ? this.resourceNotes.map(item => item.id === note.id ? note : item)
          : [...this.resourceNotes, note];
        this.expandedResourceNotes.add(note.id);
        this.memoDraft = undefined;
        this.render();
      },
      this.resourceStatus,
      'No se pudo guardar la nota'
    );
  }

  private async addTodo(): Promise<void> {
    const projectId = this.options.getProjectId();
    const text = this.todoInput.value.trim();
    if (!projectId || !text || this.busy || this.selectingTodos) return;
    const now = Date.now();
    const todo: ProjectTodoRecord = {
      projectId,
      id: crypto.randomUUID(),
      text,
      completed: false,
      createdAt: now,
      updatedAt: now
    };
    this.trackWrite(
      () => saveProjectTodo(todo),
      () => {
        this.todos = [...this.todos, todo];
        this.todoInput.value = '';
        this.renderTodos();
      },
      this.todoStatus,
      'No se pudo guardar la tarea'
    );
  }

  private render(): void {
    this.renderProjectNotes();
    this.renderTodos();
    this.renderResources();
    this.renderSelectedResourcePrompt();
    this.root.setAttribute('aria-busy', String(this.busy));
    this.projectMemoCreateButton.disabled = this.busy;
    this.projectMemoSelectionButton.disabled = this.busy;
    this.projectMemoDeleteButton.disabled = this.busy;
    this.todoCreateButton.disabled = this.busy;
    this.todoSelectionButton.disabled = this.busy;
    this.todoDeleteButton.disabled = this.busy;
    this.todoSubmitButton.disabled = this.busy;
    this.resourceCreateButton.disabled = this.busy || !this.selectedResource;
    this.root.querySelectorAll<HTMLButtonElement | HTMLInputElement | HTMLTextAreaElement>('button, input, textarea')
      .forEach(element => {
        if (element.id !== 'closeNotesButton') element.disabled = this.busy;
      });
    this.todoInput.disabled = this.busy || this.selectingTodos;
    this.resourceCreateButton.disabled = this.busy || !this.selectedResource;
  }

  private renderProjectNotes(): void {
    this.projectMemoCreateButton.textContent = this.selectingProjectNotes
      ? 'Cancelar'
      : this.memoDraft?.kind === 'project' ? 'Cancelar' : 'Nueva nota';
    this.projectMemoSelectionButton.hidden = this.selectingProjectNotes;
    this.projectMemoSelectionButton.textContent = 'Borrar';
    this.projectMemoDeleteButton.hidden = !this.selectingProjectNotes || !this.selectedProjectNotes.size;
    this.projectMemoList.replaceChildren();
    if (this.memoDraft?.kind === 'project') {
      this.projectMemoList.append(this.createMemoEditor(this.memoDraft));
    }
    if (!this.projectNotes.length && this.memoDraft?.kind !== 'project') {
      this.projectMemoList.append(this.emptyState('Todavía no hay notas', 'Crea una nota para guardar contexto, decisiones o referencias.'));
    }
    for (const note of this.projectNotes) {
      this.projectMemoList.append(this.createMemoItem(note, this.selectingProjectNotes, this.selectedProjectNotes, this.expandedProjectNotes));
    }
  }

  private renderTodos(): void {
    this.todoCreateButton.textContent = this.selectingTodos ? 'Cancelar' : 'Nueva tarea';
    this.todoSelectionButton.hidden = this.selectingTodos;
    this.todoSelectionButton.textContent = this.selectingTodos ? 'Cancelar' : 'Borrar';
    this.todoDeleteButton.hidden = !this.selectingTodos || !this.selectedTodos.size;
    this.todoForm.hidden = this.selectingTodos;
    this.todoSubmitButton.textContent = 'Añadir';
    this.todoInput.disabled = this.busy || this.selectingTodos;
    this.todoList.replaceChildren();
    if (!this.todos.length) {
      const empty = document.createElement('li');
      empty.className = 'notes-empty';
      empty.textContent = 'No hay tareas. Añade la primera para organizar el proyecto.';
      this.todoList.append(empty);
    }
    for (const todo of this.todos) {
      const item = document.createElement('li');
      item.className = `todo-item${todo.completed ? ' completed' : ''}`;
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = todo.completed;
      checkbox.disabled = this.busy;
      checkbox.setAttribute('aria-label', `Marcar tarea como ${todo.completed ? 'pendiente' : 'completada'}`);
      checkbox.addEventListener('change', () => this.updateTodo(
        todo,
        { completed: checkbox.checked },
        false,
        () => { checkbox.checked = todo.completed; }
      ));
      item.append(checkbox);
      if (this.selectingTodos) item.append(this.createSelectionCheckbox(todo.id, this.selectedTodos, this.renderTodos.bind(this), `Seleccionar tarea: ${todo.text}`));
      const expander = document.createElement('button');
      expander.className = 'todo-expander';
      expander.type = 'button';
      expander.textContent = todo.text;
      expander.setAttribute('aria-expanded', String(this.expandedTodos.has(todo.id)));
      expander.addEventListener('click', () => {
        this.expandedTodos.has(todo.id) ? this.expandedTodos.delete(todo.id) : this.expandedTodos.add(todo.id);
        this.renderTodos();
      });
      item.append(expander);
      if (this.expandedTodos.has(todo.id) && !this.selectingTodos) {
        const actions = document.createElement('div');
        actions.className = 'memo-actions';
        const edit = document.createElement('button');
        edit.className = 'button button-quiet button-small';
        edit.type = 'button';
        edit.textContent = 'Editar';
        edit.addEventListener('click', () => {
          this.editingTodoId = todo.id;
          this.renderTodos();
        });
        actions.append(edit);
        item.append(actions);
        if (this.editingTodoId === todo.id) item.append(this.createTodoEditor(todo));
      }
      this.todoList.append(item);
    }
  }

  private renderResources(): void {
    this.resourceList.replaceChildren();
    const files = this.options.getFiles().filter(
      (file): file is ProjectFile & { resourceId: string } => Boolean(file.resourceId)
    );
    const filesById = new Map(files.map(file => [file.resourceId, file] as const));
    const notesByResource = new Map<string, ResourceNoteRecord[]>();
    for (const note of this.resourceNotes) {
      const current = notesByResource.get(note.resourceId) ?? [];
      current.push(note);
      notesByResource.set(note.resourceId, current);
    }
    if (this.memoDraft?.kind === 'resource' && !this.memoDraft.id) {
      this.resourceList.append(this.createMemoEditor(this.memoDraft));
    }
    const activeIds = new Set(filesById.keys());
    let activeCount = 0;
    for (const [resourceId, notes] of notesByResource) {
      const file = filesById.get(resourceId);
      if (!file || !notes.length) continue;
      activeCount += 1;
      this.resourceList.append(this.createResourceFileItem(file, notes));
    }
    if (!activeCount && this.memoDraft?.kind !== 'resource') {
      this.resourceList.append(this.emptyState(
        'No hay notas de archivo',
        files.length
          ? 'Selecciona un archivo en el gestor para crear su primera nota.'
          : 'Añade un archivo para poder crear notas vinculadas a él.'
      ));
    }
    const orphanNotes = this.resourceNotes.filter(note => !activeIds.has(note.resourceId));
    this.orphanNotesSection.hidden = !orphanNotes.length;
    this.orphanNotesSummary.textContent = `Notas archivadas (${orphanNotes.length})`;
    this.orphanNotesList.replaceChildren();
    for (const note of orphanNotes) {
      const item = document.createElement('li');
      item.className = 'orphan-note';
      const title = document.createElement('strong');
      title.textContent = note.title;
      const path = document.createElement('small');
      path.textContent = note.lastKnownPath || 'Archivo eliminado';
      const content = document.createElement('p');
      content.textContent = note.content || 'Nota vacía';
      item.append(title, path, content);
      this.orphanNotesList.append(item);
    }
  }

  private renderSelectedResourcePrompt(): void {
    const file = this.selectedResource;
    this.selectedResourcePrompt.hidden = !file;
    const noteCount = file ? this.resourceNotes.filter(note => note.resourceId === file.resourceId).length : 0;
    if (file) this.selectedResourcePromptText.textContent = `${resourceName(file.path)} · ${noteCount} notas`;
    this.resourceCreateButton.textContent = this.memoDraft?.kind === 'resource'
      ? 'Cancelar'
      : noteCount ? 'Nueva nota' : 'Crear primera nota';
    this.resourceCreateButton.onclick = () => {
      if (this.memoDraft?.kind === 'resource') {
        this.memoDraft = undefined;
        this.render();
      } else {
        this.startMemoDraft({ kind: 'resource', resourceId: this.selectedResource?.resourceId });
      }
    };
  }

  private createMemoItem(
    note: ProjectNoteRecord | ResourceNoteRecord,
    selecting: boolean,
    selected: Set<string>,
    expanded: Set<string>
  ): HTMLElement {
    const item = document.createElement('article');
    item.className = 'memo-card';
    const header = document.createElement('div');
    header.className = 'memo-card-heading';
    if (selecting) header.append(this.createSelectionCheckbox(note.id, selected, () => {
      this.renderProjectNotes();
      this.renderResources();
    }, `Seleccionar nota: ${note.title}`));
    const toggle = document.createElement('button');
    toggle.className = 'memo-title';
    toggle.type = 'button';
    toggle.textContent = note.title;
    toggle.setAttribute('aria-expanded', String(expanded.has(note.id)));
    toggle.addEventListener('click', () => {
      expanded.has(note.id) ? expanded.delete(note.id) : expanded.add(note.id);
      this.renderProjectNotes();
      this.renderResources();
    });
    header.append(toggle);
    item.append(header);
    const body = document.createElement('div');
    body.className = 'memo-card-body';
    body.hidden = !expanded.has(note.id);
    if (body.hidden) {
      const preview = document.createElement('p');
      preview.className = 'memo-preview';
      preview.textContent = note.content || 'Nota vacía';
      item.append(preview);
    } else if (
      this.memoDraft?.id === note.id
      && ((this.memoDraft.kind === 'resource' && 'resourceId' in note)
        || (this.memoDraft.kind === 'project' && !('resourceId' in note)))
    ) {
      body.append(this.createMemoEditor(this.memoDraft));
    } else {
      const content = document.createElement('p');
      content.className = 'memo-content';
      content.textContent = note.content || 'Nota vacía';
      const actions = document.createElement('div');
      actions.className = 'memo-actions';
      const edit = document.createElement('button');
      edit.className = 'button button-quiet button-small';
      edit.type = 'button';
      edit.textContent = 'Editar';
      edit.addEventListener('click', () => this.startMemoDraft({
        kind: 'resourceId' in note ? 'resource' : 'project',
        resourceId: 'resourceId' in note ? note.resourceId : undefined,
        id: note.id
      }));
      const remove = document.createElement('button');
      remove.className = 'button button-quiet button-small';
      remove.type = 'button';
      remove.textContent = 'Eliminar';
      remove.addEventListener('click', () => this.options.onRequestDelete(
        'resourceId' in note ? 'resourceNotes' : 'projectNotes', [note.id]
      ));
      actions.append(edit, remove);
      body.append(content, actions);
    }
    item.append(body);
    return item;
  }

  private createResourceFileItem(file: ProjectFile, notes: ResourceNoteRecord[]): HTMLElement {
    const details = document.createElement('details');
    details.className = 'resource-note-file';
    const summary = document.createElement('summary');
    const name = document.createElement('span');
    name.className = 'resource-note-file-name';
    name.textContent = resourceName(file.path);
    const count = document.createElement('span');
    count.textContent = `${notes.length} notas`;
    summary.append(name, count);
    details.append(summary);
    const open = document.createElement('button');
    open.className = 'resource-note-file-open';
    open.type = 'button';
    open.textContent = 'Abrir en el gestor';
    open.title = `Abrir ${file.path} en el gestor`;
    open.addEventListener('click', () => this.options.onNavigateToResource(file.path));
    details.append(open);
    const metadata = document.createElement('div');
    metadata.className = 'resource-note-metadata';
    const path = document.createElement('p');
    path.textContent = `Ruta: ${file.path}`;
    const size = document.createElement('p');
    size.textContent = `Peso: ${formatBytes(file.blob.size)}`;
    const dimensions = document.createElement('p');
    dimensions.textContent = `Dimensiones: ${file.mimeType.startsWith('image/') ? 'No calculadas' : 'No aplica'}`;
    metadata.append(path, size, dimensions);
    details.append(metadata);
    for (const note of notes) {
      const row = this.createMemoItem(note, false, new Set(), this.expandedResourceNotes);
      details.append(row);
    }
    details.addEventListener('toggle', () => {
      if (!details.open || !file.mimeType.startsWith('image/')) return;
      void this.getDimensions(file.blob).then(value => {
        if (details.isConnected) dimensions.textContent = `Dimensiones: ${value}`;
      });
    });
    return details;
  }

  private createMemoEditor(draft: MemoDraft): HTMLFormElement {
    const form = document.createElement('form');
    form.className = 'memo-editor';
    const note = draft.id
      ? draft.kind === 'project'
        ? this.projectNotes.find(item => item.id === draft.id)
        : this.resourceNotes.find(item => item.id === draft.id)
      : undefined;
    const titleLabel = document.createElement('label');
    titleLabel.textContent = 'Título';
    const title = document.createElement('input');
    title.name = 'title';
    title.type = 'text';
    title.maxLength = 120;
    title.required = true;
    title.value = note?.title ?? '';
    titleLabel.append(title);
    const contentLabel = document.createElement('label');
    contentLabel.textContent = 'Contenido';
    const content = document.createElement('textarea');
    content.name = 'content';
    content.rows = 5;
    content.value = note?.content ?? '';
    contentLabel.append(content);
    const actions = document.createElement('div');
    actions.className = 'memo-actions';
    const cancel = document.createElement('button');
    cancel.className = 'button button-quiet button-small';
    cancel.type = 'button';
    cancel.dataset.cancel = 'true';
    cancel.textContent = 'Cancelar';
    const save = document.createElement('button');
    save.className = 'button button-primary button-small';
    save.type = 'submit';
    save.textContent = 'Guardar';
    actions.append(cancel, save);
    form.append(titleLabel, contentLabel, actions);
    form.addEventListener('submit', event => {
      event.preventDefault();
      void this.saveMemo(form, draft);
    });
    cancel.addEventListener('click', () => {
      this.memoDraft = undefined;
      this.render();
    });
    return form;
  }

  private createTodoEditor(todo: ProjectTodoRecord): HTMLElement {
    const form = document.createElement('form');
    form.className = 'todo-edit-form';
    const input = document.createElement('input');
    input.type = 'text';
    input.value = todo.text;
    input.maxLength = 240;
    input.required = true;
    input.setAttribute('aria-label', 'Editar tarea');
    const save = document.createElement('button');
    save.className = 'button button-primary button-small';
    save.type = 'submit';
    save.textContent = 'Guardar';
    const cancel = document.createElement('button');
    cancel.className = 'button button-quiet button-small';
    cancel.type = 'button';
    cancel.textContent = 'Cancelar';
    form.append(input, save, cancel);
    form.addEventListener('submit', event => {
      event.preventDefault();
      const text = input.value.trim();
      if (text) this.updateTodo(todo, { text }, true);
    });
    cancel.addEventListener('click', () => {
      this.editingTodoId = undefined;
      this.renderTodos();
    });
    return form;
  }

  private updateTodo(todo: ProjectTodoRecord, changes: Partial<ProjectTodoRecord>, closeEditor = false, failure?: () => void): void {
    const updated = { ...todo, ...changes, updatedAt: Date.now() };
    this.trackWrite(
      () => saveProjectTodo(updated),
      () => {
        this.todos = this.todos.map(item => item.id === todo.id ? updated : item);
        if (closeEditor) this.editingTodoId = undefined;
        this.renderTodos();
      },
      this.todoStatus,
      'No se pudo guardar la tarea',
      failure
    );
  }

  private createSelectionCheckbox(id: string, selected: Set<string>, render: () => void, label: string): HTMLInputElement {
    const checkbox = document.createElement('input');
    checkbox.className = 'notes-selection-checkbox';
    checkbox.type = 'checkbox';
    checkbox.checked = selected.has(id);
    checkbox.disabled = this.busy;
    checkbox.setAttribute('aria-label', label);
    checkbox.addEventListener('change', () => {
      if (checkbox.checked) selected.add(id);
      else selected.delete(id);
      render();
    });
    return checkbox;
  }

  private emptyState(title: string, description: string): HTMLElement {
    const empty = document.createElement('div');
    empty.className = 'notes-empty';
    const heading = document.createElement('strong');
    heading.textContent = title;
    const message = document.createElement('p');
    message.textContent = description;
    empty.append(heading, message);
    return empty;
  }

  private async getDimensions(blob: Blob): Promise<string> {
    const cached = this.dimensions.get(blob);
    if (cached) return cached;
    try {
      const image = await createImageBitmap(blob);
      const value = `${image.width} × ${image.height}`;
      image.close();
      this.dimensions.set(blob, value);
      return value;
    } catch {
      return 'No se pudieron leer';
    }
  }
}
