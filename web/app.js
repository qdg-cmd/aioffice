import { GeminiService } from './gemini.js';

// Global Application Instance
class AIOfficeApp {
  constructor() {
    this.gemini = new GeminiService();
    this.tabs = [];
    this.activeTabId = null;
    this.tabCounter = 1;

    // DOM Elements
    this.tabsBar = document.getElementById('tabsBar');
    this.editorCanvas = document.getElementById('editorCanvas');
    this.aiMessages = document.getElementById('aiMessages');
    this.aiPromptInput = document.getElementById('aiPromptInput');
    this.btnSendAi = document.getElementById('btnSendAi');
    this.geminiBadge = document.getElementById('geminiBadge');
    this.apiKeyModal = document.getElementById('apiKeyModal');
    this.inputApiKey = document.getElementById('inputApiKey');
    this.btnSaveKey = document.getElementById('btnSaveKey');
    this.btnCancelKey = document.getElementById('btnCancelKey');
    this.themeToggle = document.getElementById('themeToggle');
    this.sidebarToggle = document.getElementById('sidebarToggle');
    this.aiPanelToggle = document.getElementById('aiPanelToggle');
    this.fileInput = document.getElementById('fileInput');

    this.initEventListeners();
    this.initDefaultTabs();
    this.updateGeminiStatusBadge();
  }

  initEventListeners() {
    // Top Action Buttons
    document.getElementById('btnNewDoc').addEventListener('click', () => this.createNewTab('md'));
    document.getElementById('btnOpenFile').addEventListener('click', () => this.fileInput.click());
    document.getElementById('btnSaveFile').addEventListener('click', () => this.saveCurrentFile());
    document.getElementById('btnExportFile').addEventListener('click', () => this.exportCurrentFile());

    // File input change
    this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));

    // Format selection buttons in sidebar
    document.querySelectorAll('.format-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const fmt = e.currentTarget.dataset.format;
        if (fmt) this.createNewTab(fmt);
      });
    });

    // Theme Toggle
    this.themeToggle.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || 'dark';
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      this.themeToggle.textContent = next === 'dark' ? '🌙' : '☀️';
    });

    // Sidebar Toggles
    this.sidebarToggle.addEventListener('click', () => {
      document.getElementById('sidebarLeft').classList.toggle('collapsed');
    });
    this.aiPanelToggle.addEventListener('click', () => {
      document.getElementById('sidebarRight').classList.toggle('collapsed');
    });

    // Gemini API Key Modal
    this.geminiBadge.addEventListener('click', () => this.openApiKeyModal());
    this.btnCancelKey.addEventListener('click', () => this.closeApiKeyModal());
    this.btnSaveKey.addEventListener('click', () => this.saveApiKey());

    // AI Send
    this.btnSendAi.addEventListener('click', () => this.sendAiPrompt());
    this.aiPromptInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendAiPrompt();
      }
    });

    // AI Quick Action Pills
    document.querySelectorAll('.action-pill').forEach(pill => {
      pill.addEventListener('click', (e) => {
        const action = e.currentTarget.dataset.action;
        this.triggerQuickAction(action);
      });
    });

    // Hancom Hangul Shortcuts Global Interceptor for HWP tabs
    window.addEventListener('keydown', (e) => this.handleGlobalShortcuts(e));

    // Global Drag & Drop File Loading
    window.addEventListener('dragover', (e) => {
      e.preventDefault();
      document.body.classList.add('drag-over');
    });
    window.addEventListener('dragleave', (e) => {
      if (e.clientX <= 0 || e.clientY <= 0) {
        document.body.classList.remove('drag-over');
      }
    });
    window.addEventListener('drop', (e) => {
      e.preventDefault();
      document.body.classList.remove('drag-over');
      const file = e.dataTransfer?.files?.[0];
      if (file) {
        this.loadFile(file);
      }
    });
  }

  updateGeminiStatusBadge() {
    const dot = this.geminiBadge.querySelector('.dot');
    const label = this.geminiBadge.querySelector('.badge-label');
    if (this.gemini.hasApiKey()) {
      dot.style.background = 'var(--success)';
      label.textContent = 'Gemini Flash Lite (연결됨)';
    } else {
      dot.style.background = 'var(--warning)';
      label.textContent = 'Gemini 키 설정 필요';
    }
  }

  openApiKeyModal() {
    this.inputApiKey.value = this.gemini.getApiKey();
    this.apiKeyModal.style.display = 'flex';
  }

  closeApiKeyModal() {
    this.apiKeyModal.style.display = 'none';
  }

  async saveApiKey() {
    const key = this.inputApiKey.value.trim();
    if (!key) {
      alert('API 키를 입력해 주세요.');
      return;
    }
    this.btnSaveKey.disabled = true;
    this.btnSaveKey.textContent = '확인 중...';
    try {
      await this.gemini.testApiKey(key);
      this.gemini.setApiKey(key);
      this.updateGeminiStatusBadge();
      this.closeApiKeyModal();
      this.addAiMessage('ai', '✅ Google Gemini API 키가 성공적으로 등록되었습니다. 이제 자유롭게 AI 문서 작성을 지시할 수 있습니다!');
    } catch (err) {
      alert(`키 확인 실패: ${err.message}`);
    } finally {
      this.btnSaveKey.disabled = false;
      this.btnSaveKey.textContent = '저장';
    }
  }

  initDefaultTabs() {
    this.createNewTab('hwp', '보고서_초안.hwp', '=== AIOffice 한글 보고서 ===\n\n1. 개요\n본 문서는 AIOffice 웹 앱에서 작성된 문서입니다.\n\n2. 주요 내용\n- 100% 브라우저 기반 구동\n- Google Gemini 최신 모델(gemini-flash-lite-latest) 탑재\n- 한컴 한글 단축키 및 서식 완벽 지원\n\n3. 결론\n모든 문서 업무를 빠르고 안전하게 처리합니다.');
    this.createNewTab('md', '회의록.md', '# 2026 하반기 AIOffice 프로젝트 회의록\n\n**일시:** 2026-10-25\n**참석자:** 개발팀, 기획팀\n\n## 주요 안건\n- [x] 이음오피스 REA 아키텍처 분석 완료\n- [x] AIOffice 화이트라벨 리브랜딩 적용\n- [x] Google Gemini Flash Lite 최적화\n- [ ] GitHub Pages 배포\n\n```javascript\nconsole.log("AIOffice Web Ready!");\n```');
    this.createNewTab('xlsx', '예산_계획.xlsx');
  }

  createNewTab(type, title = null, content = null) {
    const id = `tab_${Date.now()}_${this.tabCounter++}`;
    const extMap = {
      hwp: '.hwp',
      docx: '.docx',
      xlsx: '.xlsx',
      pptx: '.pptx',
      pdf: '.pdf',
      md: '.md',
      html: '.html',
      xmind: '.xmind',
      epub: '.epub'
    };
    const ext = extMap[type] || `.${type}`;
    const defaultTitle = title || `새_문서_${this.tabs.length + 1}${ext}`;

    const isObjectContent = typeof content === 'object' && content !== null && !Array.isArray(content);
    const newTab = {
      id,
      type,
      title: defaultTitle,
      content: isObjectContent ? (content.text || `[${type.toUpperCase()} 문서: ${defaultTitle}]`) : (content || this.getDefaultContent(type, defaultTitle)),
      blobUrl: isObjectContent ? content.blobUrl : null,
      base64Data: isObjectContent ? content.base64Data : null,
      mimeType: isObjectContent ? content.mimeType : null,
      fileSize: isObjectContent ? content.fileSize : null,
      isDirty: false
    };

    this.tabs.push(newTab);
    this.renderTabsBar();
    this.switchTab(id);
  }

  getDefaultContent(type, title) {
    switch (type) {
      case 'hwp':
        return `[한글 문서: ${title}]\n\n본문 내용을 자유롭게 작성하세요.\n단축키 Alt+Shift+E(글자 확대), Alt+Shift+R(글자 축소), Alt+Shift+W/N(자간 조절)을 지원합니다.`;
      case 'md':
        return `# ${title.replace(/\.[^/.]+$/, '')}\n\n여기에 마크다운 내용을 입력하세요.\n실시간 미리보기와 표, 수식이 지원됩니다.`;
      case 'xlsx':
        return JSON.stringify({
          headers: ['A', 'B', 'C', 'D', 'E'],
          rows: [
            ['항목', '단가', '수량', '합계', '비고'],
            ['노트북', '1500000', '2', '=B2*C2', '개발팀'],
            ['모니터', '350000', '4', '=B3*C3', '사무실'],
            ['키보드', '120000', '5', '=B4*C4', '신규 지급'],
            ['총계', '', '', '=SUM(D2:D4)', '예산 승인']
          ]
        });
      case 'pptx':
        return JSON.stringify([
          { title: 'AIOffice 스마트 오피스', points: ['100% 브라우저 기반 오피스 스위트', 'Google Gemini AI 탑재', '다양한 포맷 통합 지원'] },
          { title: '주요 핵심 기능', points: ['한글, 워드, 엑셀, PPT, PDF 지원', '스마트 서식 및 표 데이터 자동 생성', '로컬 보안 및 프라이버시 보호'] },
          { title: '향후 로드맵', points: ['클라우드 협업 강화', '맞춤형 AI 에이전트 템플릿 제공'] }
        ]);
      case 'xmind':
        return JSON.stringify({
          title: 'AIOffice 마인드맵',
          children: [
            { title: '문서 엔진', children: [{ title: '한글 HWP' }, { title: '워드 DOCX' }, { title: '엑셀 XLSX' }] },
            { title: 'AI 기능', children: [{ title: 'Gemini Flash Lite' }, { title: '자동 요약' }, { title: '표 채우기' }] }
          ]
        });
      default:
        return `새로운 ${type.toUpperCase()} 문서입니다.`;
    }
  }

  renderTabsBar() {
    this.tabsBar.innerHTML = '';
    this.tabs.forEach(tab => {
      const el = document.createElement('div');
      el.className = `tab-item ${tab.id === this.activeTabId ? 'active' : ''}`;
      el.innerHTML = `
        <span>📄 ${this.escapeHtml(tab.title)}</span>
        <span class="tab-close" data-id="${tab.id}">✕</span>
      `;
      el.addEventListener('click', (e) => {
        if (!e.target.classList.contains('tab-close')) {
          this.switchTab(tab.id);
        }
      });
      el.querySelector('.tab-close').addEventListener('click', (e) => {
        e.stopPropagation();
        this.closeTab(tab.id);
      });
      this.tabsBar.appendChild(el);
    });

    const addBtn = document.createElement('button');
    addBtn.className = 'tab-new-btn';
    addBtn.title = '새 마크다운 탭';
    addBtn.textContent = '+';
    addBtn.addEventListener('click', () => this.createNewTab('md'));
    this.tabsBar.appendChild(addBtn);
  }

  switchTab(tabId) {
    this.activeTabId = tabId;
    this.renderTabsBar();
    this.renderEditor();
  }

  closeTab(tabId) {
    const idx = this.tabs.findIndex(t => t.id === tabId);
    if (idx === -1) return;
    this.tabs.splice(idx, 1);
    if (this.tabs.length === 0) {
      this.createNewTab('md');
    } else {
      const nextTab = this.tabs[Math.max(0, idx - 1)];
      this.switchTab(nextTab.id);
    }
  }

  getActiveTab() {
    return this.tabs.find(t => t.id === this.activeTabId) || null;
  }

  renderEditor() {
    const tab = this.getActiveTab();
    if (!tab) return;

    this.editorCanvas.innerHTML = '';

    // Render toolbar
    const toolbar = document.createElement('div');
    toolbar.className = 'editor-toolbar';
    toolbar.innerHTML = `
      <span style="font-size:0.8rem; font-weight:600; color:var(--text-secondary);">${tab.type.toUpperCase()} 편집 모드</span>
      <span style="color:var(--border-color);">|</span>
      <button class="btn btn-sm" id="btnApplyFormatting"><b>B</b></button>
      <button class="btn btn-sm" id="btnItalic"><i>I</i></button>
      <button class="btn btn-sm" id="btnUnderline"><u>U</u></button>
      <span style="flex:1;"></span>
      <button class="btn btn-sm btn-primary" id="btnQuickSummarize">⚡ Gemini 요약</button>
    `;
    this.editorCanvas.appendChild(toolbar);

    toolbar.querySelector('#btnQuickSummarize').addEventListener('click', () => this.triggerQuickAction('summarize'));

    const contentArea = document.createElement('div');
    contentArea.className = 'editor-content-area';
    this.editorCanvas.appendChild(contentArea);

    switch (tab.type) {
      case 'pdf':
        this.renderPdfViewer(contentArea, tab);
        break;
      case 'image':
        this.renderImageViewer(contentArea, tab);
        break;
      case 'md':
        this.renderMarkdownEditor(contentArea, tab);
        break;
      case 'xlsx':
        this.renderSpreadsheetEditor(contentArea, tab);
        break;
      case 'pptx':
        this.renderSlidesEditor(contentArea, tab);
        break;
      case 'xmind':
        this.renderMindmapEditor(contentArea, tab);
        break;
      case 'hwp':
      case 'docx':
      default:
        this.renderDocumentEditor(contentArea, tab);
        break;
    }
  }

  renderMarkdownEditor(container, tab) {
    const split = document.createElement('div');
    split.className = 'markdown-split';

    const input = document.createElement('textarea');
    input.className = 'markdown-input';
    input.value = tab.content;

    const preview = document.createElement('div');
    preview.className = 'markdown-preview';
    preview.innerHTML = this.renderMarkdownHtml(tab.content);

    input.addEventListener('input', () => {
      tab.content = input.value;
      tab.isDirty = true;
      preview.innerHTML = this.renderMarkdownHtml(input.value);
    });

    split.appendChild(input);
    split.appendChild(preview);
    container.appendChild(split);
  }

  renderMarkdownHtml(text) {
    if (!text) return '<p style="color:var(--text-muted);">내용이 비어 있습니다.</p>';
    // Simple fast safe markdown rendering
    let html = this.escapeHtml(text)
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/gim, '<em>$1</em>')
      .replace(/```([\s\S]*?)```/gim, '<pre><code>$1</code></pre>')
      .replace(/`([^`]+)`/gim, '<code>$1</code>')
      .replace(/\n$/gim, '<br />')
      .replace(/\n/gim, '<br />');
    return html;
  }

  renderSpreadsheetEditor(container, tab) {
    let data;
    try {
      data = JSON.parse(tab.content);
    } catch {
      data = { headers: ['A', 'B', 'C', 'D'], rows: [['', '', '', '']] };
    }

    const wrapper = document.createElement('div');
    wrapper.className = 'sheet-container';

    const formulaBar = document.createElement('div');
    formulaBar.className = 'formula-bar';
    formulaBar.innerHTML = `
      <span style="font-weight:700; color:var(--accent);">fx</span>
      <input type="text" class="formula-input" id="sheetFormulaInput" placeholder="셀을 선택하거나 수식을 입력하세요 (=SUM, =AVERAGE 등)" />
    `;
    wrapper.appendChild(formulaBar);

    const gridWrapper = document.createElement('div');
    gridWrapper.className = 'sheet-grid-wrapper';

    const table = document.createElement('table');
    table.className = 'sheet-table';

    // Header
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    headerRow.innerHTML = '<th>#</th>' + data.headers.map(h => `<th>${h}</th>`).join('');
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Body
    const tbody = document.createElement('tbody');
    data.rows.forEach((row, rIdx) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<th>${rIdx + 1}</th>`;
      row.forEach((cellVal, cIdx) => {
        const td = document.createElement('td');
        td.className = 'sheet-cell';
        td.contentEditable = 'true';
        td.textContent = cellVal;
        td.addEventListener('blur', () => {
          data.rows[rIdx][cIdx] = td.textContent;
          tab.content = JSON.stringify(data);
          tab.isDirty = true;
        });
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);

    gridWrapper.appendChild(table);
    wrapper.appendChild(gridWrapper);
    container.appendChild(wrapper);
  }

  renderSlidesEditor(container, tab) {
    let slides;
    try {
      slides = JSON.parse(tab.content);
      if (!Array.isArray(slides)) slides = [];
    } catch {
      slides = [{ title: '제목 슬라이드', points: ['내용을 입력하세요'] }];
    }

    const layout = document.createElement('div');
    layout.className = 'slides-layout';

    let currentSlideIndex = 0;

    const thumbCol = document.createElement('div');
    thumbCol.className = 'slide-thumbnails';

    const canvas = document.createElement('div');
    canvas.className = 'slide-canvas';

    const updateCanvas = () => {
      const s = slides[currentSlideIndex] || { title: '', points: [] };
      canvas.innerHTML = `
        <h1 contenteditable="true" id="slideTitle">${this.escapeHtml(s.title)}</h1>
        <ul contenteditable="true" id="slidePoints" style="padding-left:24px;">
          ${s.points.map(p => `<li>${this.escapeHtml(p)}</li>`).join('')}
        </ul>
      `;

      canvas.querySelector('#slideTitle').addEventListener('blur', (e) => {
        s.title = e.target.textContent;
        tab.content = JSON.stringify(slides);
        renderThumbs();
      });

      canvas.querySelector('#slidePoints').addEventListener('blur', (e) => {
        const items = [...e.target.querySelectorAll('li')].map(li => li.textContent);
        s.points = items.length ? items : [e.target.textContent];
        tab.content = JSON.stringify(slides);
      });
    };

    const renderThumbs = () => {
      thumbCol.innerHTML = '';
      slides.forEach((s, idx) => {
        const thumb = document.createElement('div');
        thumb.className = `slide-thumb ${idx === currentSlideIndex ? 'active' : ''}`;
        thumb.innerHTML = `<strong>${idx + 1}. ${this.escapeHtml(s.title || '제목 없음')}</strong>`;
        thumb.addEventListener('click', () => {
          currentSlideIndex = idx;
          renderThumbs();
          updateCanvas();
        });
        thumbCol.appendChild(thumb);
      });

      const addSlideBtn = document.createElement('button');
      addSlideBtn.className = 'btn btn-sm';
      addSlideBtn.textContent = '+ 슬라이드 추가';
      addSlideBtn.addEventListener('click', () => {
        slides.push({ title: `슬라이드 ${slides.length + 1}`, points: ['새로운 포인트'] });
        tab.content = JSON.stringify(slides);
        currentSlideIndex = slides.length - 1;
        renderThumbs();
        updateCanvas();
      });
      thumbCol.appendChild(addSlideBtn);
    };

    renderThumbs();
    updateCanvas();

    layout.appendChild(thumbCol);
    layout.appendChild(canvas);
    container.appendChild(layout);
  }

  renderMindmapEditor(container, tab) {
    let tree;
    try {
      tree = JSON.parse(tab.content);
    } catch {
      tree = { title: '중심 토픽', children: [{ title: '하위 항목 1' }, { title: '하위 항목 2' }] };
    }

    const board = document.createElement('div');
    board.className = 'mindmap-board';

    const renderNode = (node) => {
      const wrapper = document.createElement('div');
      wrapper.style.display = 'flex';
      wrapper.style.alignItems = 'center';
      wrapper.style.gap = '20px';
      wrapper.style.margin = '10px 0';

      const box = document.createElement('div');
      box.className = 'node-box';
      box.contentEditable = 'true';
      box.textContent = node.title;
      box.addEventListener('blur', () => {
        node.title = box.textContent;
        tab.content = JSON.stringify(tree);
      });
      wrapper.appendChild(box);

      if (node.children && node.children.length) {
        const childCol = document.createElement('div');
        childCol.style.display = 'flex';
        childCol.style.flexDirection = 'column';
        childCol.style.borderLeft = '2px solid var(--accent)';
        childCol.style.paddingLeft = '16px';
        node.children.forEach(c => childCol.appendChild(renderNode(c)));
        wrapper.appendChild(childCol);
      }

      return wrapper;
    };

    board.appendChild(renderNode(tree));
    container.appendChild(board);
  }

  renderDocumentEditor(container, tab) {
    const page = document.createElement('div');
    page.className = 'doc-page';
    page.contentEditable = 'true';
    if (typeof tab.content === 'string' && (tab.content.includes('<p>') || tab.content.includes('<div>') || tab.content.includes('<h1>') || tab.content.includes('<h2>') || tab.content.includes('<table>'))) {
      page.innerHTML = tab.content;
    } else {
      page.innerText = tab.content || '';
    }

    page.addEventListener('input', () => {
      tab.content = page.innerHTML;
      tab.isDirty = true;
    });

    container.appendChild(page);
  }

  renderPdfViewer(container, tab) {
    container.innerHTML = '';
    const wrapper = document.createElement('div');
    wrapper.className = 'pdf-viewer-container';

    if (tab.blobUrl) {
      const sizeStr = tab.fileSize ? `(${(tab.fileSize / 1024 / 1024).toFixed(2)} MB)` : '';
      wrapper.innerHTML = `
        <div class="pdf-toolbar-bar">
          <div style="display:flex; align-items:center; gap:8px;">
            <span style="font-weight:600;">📕 ${this.escapeHtml(tab.title)}</span>
            <span style="color:var(--text-muted); font-size:0.75rem;">${sizeStr}</span>
          </div>
          <div style="display:flex; align-items:center; gap:8px;">
            <button class="btn btn-sm btn-primary" id="btnAiAnalyzePdf">⚡ Gemini로 이 PDF 분석·요약</button>
            <a href="${tab.blobUrl}" target="_blank" class="btn btn-sm" title="새 브라우저 탭에서 크게 보기">↗️ 새 탭에서 열기</a>
            <a href="${tab.blobUrl}" download="${this.escapeHtml(tab.title)}" class="btn btn-sm" title="내 컴퓨터로 다운로드">💾 다운로드</a>
          </div>
        </div>
        <iframe src="${tab.blobUrl}#toolbar=1&navpanes=1&scrollbar=1" class="pdf-iframe" title="PDF Viewer"></iframe>
      `;
      wrapper.querySelector('#btnAiAnalyzePdf')?.addEventListener('click', () => {
        this.aiPromptInput.value = '이 PDF 문서의 핵심 내용을 요약하고 중요한 문제나 개념을 설명해 줘.';
        this.sendAiPrompt();
      });
    } else {
      wrapper.innerHTML = `
        <div style="flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:16px; color:var(--text-secondary); padding:40px; text-align:center;">
          <div style="font-size:3.5rem;">📕</div>
          <h3 style="color:var(--text-primary); font-size:1.3rem;">PDF 문서 뷰어</h3>
          <p style="font-size:0.9rem; max-width:460px; line-height:1.7;">
            화면 상단의 <b>[📂 파일 열기]</b> 버튼을 클릭하거나,<br>
            컴퓨터에 있는 PDF 문제집·시험지·문서를 <b>화면 위로 드래그</b>하여 놓으면<br>
            실제 책처럼 깨끗하게 열리고, Gemini AI에게 바로 질문할 수 있습니다.
          </p>
          <button class="btn btn-primary" id="btnSelectPdf">📂 내 컴퓨터에서 PDF 열기</button>
        </div>
      `;
      wrapper.querySelector('#btnSelectPdf')?.addEventListener('click', () => {
        this.fileInput.accept = '.pdf';
        this.fileInput.click();
      });
    }
    container.appendChild(wrapper);
  }

  renderImageViewer(container, tab) {
    container.innerHTML = `
      <div style="width:100%; height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:20px; overflow:auto;">
        <img src="${tab.blobUrl}" alt="${this.escapeHtml(tab.title)}" style="max-width:90%; max-height:80vh; object-fit:contain; border-radius:8px; box-shadow:0 8px 24px rgba(0,0,0,0.3);" />
        <div style="margin-top:16px; display:flex; gap:12px; align-items:center;">
          <span style="font-size:0.85rem; color:var(--text-secondary);">${this.escapeHtml(tab.title)}</span>
          <button class="btn btn-sm btn-primary" id="btnAnalyzeImage">⚡ Gemini 이미지 분석</button>
        </div>
      </div>
    `;
    container.querySelector('#btnAnalyzeImage')?.addEventListener('click', () => {
      this.aiPromptInput.value = '이 이미지에 대해 자세히 설명해 줘.';
      this.sendAiPrompt();
    });
  }

  handleGlobalShortcuts(e) {
    const tab = this.getActiveTab();
    if (!tab) return;

    // Alt+Shift Hangul shortcuts
    if (e.altKey && e.shiftKey) {
      const key = e.key.toLowerCase();
      if (key === 'e' || key === 'ㄷ') {
        e.preventDefault();
        document.execCommand('fontSize', false, '5');
        this.showToast('글자 크기 확대 (Alt+Shift+E)');
      } else if (key === 'r' || key === 'ㄱ') {
        e.preventDefault();
        document.execCommand('fontSize', false, '2');
        this.showToast('글자 크기 축소 (Alt+Shift+R)');
      }
    }
  }

  showToast(msg) {
    const toast = document.createElement('div');
    toast.style.position = 'fixed';
    toast.style.bottom = '20px';
    toast.style.left = '50%';
    toast.style.transform = 'translateX(-50%)';
    toast.style.background = 'var(--bg-card)';
    toast.style.border = '1px solid var(--accent)';
    toast.style.color = 'var(--text-primary)';
    toast.style.padding = '8px 16px';
    toast.style.borderRadius = '20px';
    toast.style.fontSize = '0.82rem';
    toast.style.zIndex = '9999';
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
  }

  async sendAiPrompt() {
    const prompt = this.aiPromptInput.value.trim();
    if (!prompt) return;

    this.aiPromptInput.value = '';
    this.addAiMessage('user', prompt);

    const activeTab = this.getActiveTab();
    const docContext = activeTab ? {
      type: activeTab.type,
      title: activeTab.title,
      content: activeTab.content,
      base64Data: activeTab.base64Data || null,
      mimeType: activeTab.mimeType || null
    } : null;

    const aiMsgEl = this.addAiMessage('ai', '생각 중...');
    this.btnSendAi.disabled = true;

    try {
      let fullResponse = '';
      await this.gemini.askGemini(prompt, docContext, (chunk) => {
        fullResponse = chunk;
        aiMsgEl.innerHTML = this.renderMarkdownHtml(fullResponse);
      });
      aiMsgEl.innerHTML = this.renderMarkdownHtml(fullResponse);
    } catch (err) {
      aiMsgEl.innerHTML = `<span style="color:var(--danger);">⚠️ ${this.escapeHtml(err.message)}</span>`;
      if (!this.gemini.hasApiKey()) {
        this.openApiKeyModal();
      }
    } finally {
      this.btnSendAi.disabled = false;
      this.aiMessages.scrollTop = this.aiMessages.scrollHeight;
    }
  }

  addAiMessage(role, text) {
    const msg = document.createElement('div');
    msg.className = `msg msg-${role}`;
    msg.innerHTML = this.renderMarkdownHtml(text);
    this.aiMessages.appendChild(msg);
    this.aiMessages.scrollTop = this.aiMessages.scrollHeight;
    return msg;
  }

  triggerQuickAction(action) {
    const activeTab = this.getActiveTab();
    if (!activeTab) return;

    const prompts = {
      summarize: '현재 열려 있는 문서의 핵심 요점과 중요 내용을 일목요연하게 요약해 줘.',
      polish: '문서의 맞춤법, 띄어쓰기, 문맥을 점검하고 자연스럽고 유려한 문장으로 다듬어 줘.',
      translate_ko: '문서의 내용을 자연스러운 한국어로 번역하고 핵심을 설명해 줘.',
      format_table: '문서의 내용을 바탕으로 체계적인 Markdown 표(Table)로 데이터를 정리해 줘.',
      fix_grammar: '문서에서 오탈자, 맞춤법, 어색한 어휘를 찾아내고 올바르게 고친 내역을 표로 보여줘.'
    };

    const promptText = prompts[action] || '문서를 검토해 줘.';
    this.aiPromptInput.value = promptText;
    this.sendAiPrompt();
  }

  loadFile(file) {
    if (!file) return;
    const ext = file.name.slice(file.name.lastIndexOf('.') + 1).toLowerCase();

    // 1. PDF Documents: Create native blob URL and read base64 for Gemini
    if (ext === 'pdf') {
      const blobUrl = URL.createObjectURL(file);
      const reader = new FileReader();
      reader.onload = (ev) => {
        const base64Data = ev.target.result.split(',')[1];
        this.createNewTab('pdf', file.name, {
          blobUrl,
          base64Data,
          mimeType: 'application/pdf',
          fileSize: file.size,
          text: `[PDF 문서: ${file.name}] 크기: ${(file.size / 1024 / 1024).toFixed(2)} MB`
        });
        this.showToast(`PDF 열기 완료: ${file.name}`);
      };
      reader.readAsDataURL(file);
      return;
    }

    // 2. Excel Spreadsheets (XLSX, XLS)
    if (ext === 'xlsx' || ext === 'xls') {
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          if (window.XLSX) {
            const data = new Uint8Array(ev.target.result);
            const workbook = window.XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const rawJson = window.XLSX.utils.sheet_to_json(sheet, { header: 1 });
            const maxCols = Math.max(...rawJson.map(r => r.length), 4);
            const headers = rawJson[0] ? rawJson[0].map((h, i) => String(h || String.fromCharCode(65 + i))) : Array.from({ length: maxCols }, (_, i) => String.fromCharCode(65 + i));
            const rows = rawJson.slice(1).map(r => {
              const row = [];
              for (let i = 0; i < headers.length; i++) {
                row.push(String(r[i] ?? ''));
              }
              return row;
            });
            this.createNewTab('xlsx', file.name, JSON.stringify({ headers, rows: rows.length ? rows : [['', '', '', '']] }));
            this.showToast(`스프레드시트 열기 완료: ${file.name}`);
          } else {
            this.createNewTab('xlsx', file.name);
          }
        } catch (err) {
          console.error('XLSX parse error', err);
          this.createNewTab('xlsx', file.name);
        }
      };
      reader.readAsArrayBuffer(file);
      return;
    }

    // 3. Word Documents (DOCX)
    if (ext === 'docx') {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        try {
          if (window.mammoth) {
            const result = await window.mammoth.convertToHtml({ arrayBuffer: ev.target.result });
            this.createNewTab('docx', file.name, result.value || `[빈 Word 문서: ${file.name}]`);
            this.showToast(`워드 문서 열기 완료: ${file.name}`);
          } else {
            this.createNewTab('docx', file.name);
          }
        } catch (err) {
          console.error('DOCX parse error', err);
          this.createNewTab('docx', file.name);
        }
      };
      reader.readAsArrayBuffer(file);
      return;
    }

    // 4. CSV Files
    if (ext === 'csv') {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const lines = ev.target.result.split(/\r?\n/).filter(Boolean);
        const rows = lines.map(line => line.split(',').map(c => c.trim().replace(/^"|"$/g, '')));
        const headers = rows[0] || ['A', 'B', 'C', 'D'];
        this.createNewTab('xlsx', file.name, JSON.stringify({ headers, rows: rows.slice(1) }));
        this.showToast(`CSV 열기 완료: ${file.name}`);
      };
      reader.readAsText(file);
      return;
    }

    // 5. Image Files (PNG, JPG, JPEG, WEBP, SVG, GIF)
    if (['png', 'jpg', 'jpeg', 'webp', 'svg', 'gif'].includes(ext)) {
      const blobUrl = URL.createObjectURL(file);
      const reader = new FileReader();
      reader.onload = (ev) => {
        const base64Data = ev.target.result.split(',')[1];
        this.createNewTab('image', file.name, {
          blobUrl,
          base64Data,
          mimeType: file.type || `image/${ext}`,
          fileSize: file.size,
          text: `[이미지 파일: ${file.name}]`
        });
        this.showToast(`이미지 열기 완료: ${file.name}`);
      };
      reader.readAsDataURL(file);
      return;
    }

    // 6. Text, Markdown, HTML, Code, HWP
    const reader = new FileReader();
    reader.onload = (ev) => {
      this.createNewTab(ext || 'txt', file.name, ev.target.result);
      this.showToast(`문서 열기 완료: ${file.name}`);
    };
    reader.readAsText(file);
  }

  handleFileSelect(e) {
    const file = e.target.files?.[0];
    if (file) {
      this.loadFile(file);
    }
    e.target.value = '';
  }

  saveCurrentFile() {
    const tab = this.getActiveTab();
    if (!tab) return;

    if (tab.blobUrl) {
      const a = document.createElement('a');
      a.href = tab.blobUrl;
      a.download = tab.title;
      a.click();
      this.showToast(`다운로드 시작: ${tab.title}`);
      return;
    }

    const blob = new Blob([tab.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = tab.title;
    a.click();
    URL.revokeObjectURL(url);
    tab.isDirty = false;
    this.showToast(`저장 완료: ${tab.title}`);
  }

  exportCurrentFile() {
    window.print();
  }

  escapeHtml(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}

// Initialize on load
window.addEventListener('DOMContentLoaded', () => {
  window.app = new AIOfficeApp();
});
