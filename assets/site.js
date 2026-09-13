(() => {
      'use strict';
      const root = document.documentElement;
      const themeButton = document.getElementById('themeToggle');
      const themeQuery = matchMedia('(prefers-color-scheme: dark)');
      let manualTheme = false;
      try { manualTheme = ['light', 'dark'].includes(localStorage.getItem('site-theme')); } catch {}
      function applyTheme(theme) {
        root.dataset.theme = theme;
        themeButton.setAttribute('aria-pressed', String(theme === 'dark'));
        themeButton.setAttribute('aria-label', theme === 'dark' ? '切换至浅色主题' : '切换至深色主题');
        document.querySelector('meta[name="theme-color"]').content = theme === 'dark' ? '#1b211e' : '#f7f5ef';
      }
      applyTheme(root.dataset.theme);
      themeButton.addEventListener('click', () => {
        const theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
        manualTheme = true;
        applyTheme(theme);
        try { localStorage.setItem('site-theme', theme); } catch {}
      });
      themeQuery.addEventListener('change', event => { if (!manualTheme) applyTheme(event.matches ? 'dark' : 'light'); });
      document.querySelectorAll('[data-current-year]').forEach(el => { el.textContent = new Date().getFullYear(); });

      // Native dialogs provide keyboard focus containment and Escape dismissal.
      const menu = document.getElementById('mobileMenu');
      const menuButton = document.getElementById('menuToggle');
      const certificate = document.getElementById('certificateViewer');
      function syncScrollLock() { document.body.style.overflow = (menu.open || certificate?.open) ? 'hidden' : ''; }
      function closeMenu() { if (menu.open) { menu.close(); menuButton.setAttribute('aria-expanded', 'false'); syncScrollLock(); } }
      menuButton.addEventListener('click', () => { menu.showModal(); menuButton.setAttribute('aria-expanded', 'true'); syncScrollLock(); });
      menu.querySelector('[data-close-menu]').addEventListener('click', closeMenu);
      menu.addEventListener('close', () => { menuButton.setAttribute('aria-expanded', 'false'); syncScrollLock(); });
      menu.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
        closeMenu();
        if (link.hash) {
          const target = document.querySelector(link.hash);
          requestAnimationFrame(() => { if (target) target.focus({ preventScroll: true }); });
        }
      }));
      matchMedia('(min-width: 761px)').addEventListener('change', event => { if (event.matches) closeMenu(); });
      [menu].forEach(dialog => dialog.addEventListener('click', event => {
        if (event.target !== dialog) return;
        const rect = dialog.getBoundingClientRect();
        if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
      }));

      const certificateOpen = document.getElementById('certificateOpen');
      if (certificate && typeof certificate.showModal === 'function' && certificateOpen) {
        certificateOpen.setAttribute('aria-haspopup', 'dialog');
        certificateOpen.setAttribute('aria-controls', 'certificateViewer');
        certificateOpen.addEventListener('click', event => {
          if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
          event.preventDefault(); certificate.showModal(); syncScrollLock();
        });
        document.getElementById('certificateClose').addEventListener('click', () => certificate.close());
        certificate.addEventListener('close', syncScrollLock);
        certificate.addEventListener('click', event => {
          if (event.target !== certificate) return;
          const box = certificate.getBoundingClientRect();
          if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) certificate.close();
        });
      }
      const status = document.getElementById('copyStatus');
      let toastTimer;
      function announce(message) {
        clearTimeout(toastTimer); status.hidden = false; status.textContent = message;
        toastTimer = setTimeout(() => { status.hidden = true; }, 3500);
      }
      function legacyCopy(value) {
        const active = document.activeElement;
        const selection = window.getSelection();
        const ranges = selection ? Array.from({ length: selection.rangeCount }, (_, i) => selection.getRangeAt(i).cloneRange()) : [];
        const field = document.createElement('textarea');
        field.value = value; field.readOnly = true; field.tabIndex = -1;
        field.style.cssText = 'position:fixed;left:-9999px;top:0;font-size:16px';
        document.body.appendChild(field);
        try { field.focus({ preventScroll: true }); field.select(); return document.execCommand('copy'); }
        finally {
          field.remove();
          if (active instanceof HTMLElement) active.focus({ preventScroll: true });
          if (selection) { selection.removeAllRanges(); ranges.forEach(range => selection.addRange(range)); }
        }
      }
      document.querySelectorAll('[data-copy]').forEach(button => button.addEventListener('click', async () => {
        let copied = false;
        try { await navigator.clipboard.writeText(button.dataset.copy); copied = true; } catch {}
        if (!copied) { try { copied = legacyCopy(button.dataset.copy); } catch {} }
        announce(copied ? `${button.dataset.label}已复制` : `请长按或选中文字复制：${button.dataset.copy}`);
      }));
    })();

