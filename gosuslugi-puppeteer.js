import puppeteer from 'puppeteer';
import { format } from 'date-fns';

const GOSUSLUGI_LOGIN = '';
const GOSUSLUGI_PASSWORD = '';

const COLD_WATER_NEW_VALUE = '';
const HOT_WATER_NEW_VALUE = '';

const TODAY_DATE = format(new Date(), 'dd.MM.yyyy');

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
  });
  const page = await browser.newPage();
  const timeout = 5000;
  page.setDefaultTimeout(timeout);

  async function waitForSelectors(selectors, frame, options) {
    for (const selector of selectors) {
      try {
        return await waitForSelector(selector, frame, options);
      } catch (err) {
        console.error(err);
      }
    }
    throw new Error(
      'Could not find element for selectors: ' + JSON.stringify(selectors)
    );
  }

  async function scrollIntoViewIfNeeded(element, timeout) {
    await waitForConnected(element, timeout);
    const isInViewport = await element.isIntersectingViewport({ threshold: 0 });
    if (isInViewport) {
      return;
    }
    await element.evaluate((element) => {
      element.scrollIntoView({
        block: 'center',
        inline: 'center',
        behavior: 'auto',
      });
    });
    await waitForInViewport(element, timeout);
  }

  async function waitForConnected(element, timeout) {
    await waitForFunction(async () => {
      return await element.getProperty('isConnected');
    }, timeout);
  }

  async function waitForInViewport(element, timeout) {
    await waitForFunction(async () => {
      return await element.isIntersectingViewport({ threshold: 0 });
    }, timeout);
  }

  async function waitForSelector(selector, frame, options) {
    if (!Array.isArray(selector)) {
      selector = [selector];
    }
    if (!selector.length) {
      throw new Error('Empty selector provided to waitForSelector');
    }
    let element = null;
    for (let i = 0; i < selector.length; i++) {
      const part = selector[i];
      if (element) {
        element = await element.waitForSelector(part, options);
      } else {
        element = await frame.waitForSelector(part, options);
      }
      if (!element) {
        throw new Error('Could not find element: ' + selector.join('>>'));
      }
      if (i < selector.length - 1) {
        element = (
          await element.evaluateHandle((el) =>
            el.shadowRoot ? el.shadowRoot : el
          )
        ).asElement();
      }
    }
    if (!element) {
      throw new Error('Could not find element: ' + selector.join('|'));
    }
    return element;
  }

  async function waitForElement(step, frame, timeout) {
    const count = step.count || 1;
    const operator = step.operator || '>=';
    const comp = {
      '==': (a, b) => a === b,
      '>=': (a, b) => a >= b,
      '<=': (a, b) => a <= b,
    };
    const compFn = comp[operator];
    await waitForFunction(async () => {
      const elements = await querySelectorsAll(step.selectors, frame);
      return compFn(elements.length, count);
    }, timeout);
  }

  async function querySelectorsAll(selectors, frame) {
    for (const selector of selectors) {
      const result = await querySelectorAll(selector, frame);
      if (result.length) {
        return result;
      }
    }
    return [];
  }

  async function querySelectorAll(selector, frame) {
    if (!Array.isArray(selector)) {
      selector = [selector];
    }
    if (!selector.length) {
      throw new Error('Empty selector provided to querySelectorAll');
    }
    let elements = [];
    for (let i = 0; i < selector.length; i++) {
      const part = selector[i];
      if (i === 0) {
        elements = await frame.$$(part);
      } else {
        const tmpElements = elements;
        elements = [];
        for (const el of tmpElements) {
          elements.push(...(await el.$$(part)));
        }
      }
      if (elements.length === 0) {
        return [];
      }
      if (i < selector.length - 1) {
        const tmpElements = [];
        for (const el of elements) {
          const newEl = (
            await el.evaluateHandle((el) =>
              el.shadowRoot ? el.shadowRoot : el
            )
          ).asElement();
          if (newEl) {
            tmpElements.push(newEl);
          }
        }
        elements = tmpElements;
      }
    }
    return elements;
  }

  async function waitForFunction(fn, timeout) {
    let isActive = true;
    setTimeout(() => {
      isActive = false;
    }, timeout);
    while (isActive) {
      const result = await fn();
      if (result) {
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    throw new Error('Timed out');
  }
  {
    const targetPage = page;
    await targetPage.setViewport({ width: 1280, height: 720 });
  }
  {
    const targetPage = page;
    const promises = [];
    promises.push(targetPage.waitForNavigation());
    await targetPage.goto('https://dom.gosuslugi.ru/');
    await Promise.all(promises);
  }
  {
    const targetPage = page;
    const promises = [];
    promises.push(targetPage.waitForNavigation());
    const element = await waitForSelectors(
      [
        ['aria/Войти'],
        [
          'body > div.page-wrapper.page-wrapper_v2 > div.portal-header.target-audience.target-audience_pad > div.container > div > div > div.col-xs-6.portal-header__right-part-wrapper > signed-status-badge > div > a',
        ],
      ],
      targetPage,
      { timeout, visible: true }
    );
    await scrollIntoViewIfNeeded(element, timeout);
    await element.click({ offset: { x: 99.40625, y: 15 } });
    await Promise.all(promises);
  }
  {
    const targetPage = page;
    const element = await waitForSelectors(
      [['aria/Телефон / Email / СНИЛС'], ['#login']],
      targetPage,
      { timeout, visible: true }
    );
    await scrollIntoViewIfNeeded(element, timeout);
    await element.click({ offset: { x: 100.5, y: 14 } });
  }
  {
    const targetPage = page;
    const element = await waitForSelectors(
      [['aria/Телефон / Email / СНИЛС'], ['#login']],
      targetPage,
      { timeout, visible: true }
    );
    await scrollIntoViewIfNeeded(element, timeout);
    const type = await element.evaluate((el) => el.type);
    if (
      [
        'textarea',
        'select-one',
        'text',
        'url',
        'tel',
        'search',
        'password',
        'number',
        'email',
      ].includes(type)
    ) {
      await element.type(GOSUSLUGI_LOGIN);
    } else {
      await element.focus();
      await element.evaluate((el, value) => {
        el.value = value;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }, GOSUSLUGI_LOGIN);
    }
  }
  {
    const targetPage = page;
    const element = await waitForSelectors(
      [['aria/Пароль'], ['#password']],
      targetPage,
      { timeout, visible: true }
    );
    await scrollIntoViewIfNeeded(element, timeout);
    const type = await element.evaluate((el) => el.type);
    if (
      [
        'textarea',
        'select-one',
        'text',
        'url',
        'tel',
        'search',
        'password',
        'number',
        'email',
      ].includes(type)
    ) {
      await element.type(GOSUSLUGI_PASSWORD);
    } else {
      await element.focus();
      await element.evaluate((el, value) => {
        el.value = value;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }, GOSUSLUGI_PASSWORD);
    }
  }
  {
    const targetPage = page;
    const promises = [];
    promises.push(targetPage.waitForNavigation());
    const element = await waitForSelectors(
      [
        ['aria/Войти'],
        [
          'body > esia-root > div > esia-idp > div > div.form-container.mb-20.mb-md-40 > form > div.mb-24 > button',
        ],
      ],
      targetPage,
      { timeout, visible: true }
    );
    await scrollIntoViewIfNeeded(element, timeout);
    await element.click({ offset: { x: 138.5, y: 22 } });
    await Promise.all(promises);
  }
  {
    const targetPage = page;
    const promises = [];
    promises.push(targetPage.waitForNavigation());
    const element = await waitForSelectors(
      [['#loginForm > div > div:nth-child(2) > div.right-block > label > p']],
      targetPage,
      { timeout, visible: true }
    );
    await scrollIntoViewIfNeeded(element, timeout);
    await element.click({ offset: { x: 38.3125, y: 6 } });
    await Promise.all(promises);
  }
  {
    const targetPage = page;
    let frame = targetPage.mainFrame();
    const element = await waitForSelectors(
      [
        [
          'body > div.page-wrapper > div.app-content-wrapper > div > div > ef-ppa-lk-grzh > div > div > div > div > div.row > div.col-xs-8 > ef-ppa-lk-grzh-tiles > div:nth-child(1) > div.row > div:nth-child(3) > div > a > div.citizen-cabinet__tile-button-label.ng-scope > div > span:nth-child(1)',
        ],
      ],
      frame,
      { timeout: timeout * 3, visible: true }
    );
    await scrollIntoViewIfNeeded(element, timeout);
    await element.click({ offset: { x: 66.671875, y: 28.5 } });
  }

  // Close alert
  {
    const targetPage = page;
    const element = await waitForSelectors(
      [
        ['aria/Закрыть'],
        [
          'body > div.modal.fade.ng-isolate-scope.z-index-xxl.in > div > div > div > div.modal-footer.modal-base__footer.text-center > button > span',
        ],
      ],
      targetPage,
      { timeout: timeout * 3, visible: true }
    );
    await scrollIntoViewIfNeeded(element, timeout);
    await element.click();
  }

  const formSelector = `form[name="form.spug1Form"]`;

  // Cold water
  {
    const targetPage = page;
    const element = await waitForSelector(
      [`${formSelector} table tr:nth-of-type(2) input.form-control[size]`],
      targetPage,
      { timeout, visible: true }
    );

    await element.type(COLD_WATER_NEW_VALUE);
  }
  {
    const targetPage = page;
    const element = await waitForSelector(
      [
        `${formSelector} table tr:nth-of-type(2) input.form-control.datePickerStringInput`,
      ],
      targetPage,
      { timeout, visible: true }
    );
    await element.type(TODAY_DATE);
  }

  // Hot water
  {
    const targetPage = page;
    const element = await waitForSelector(
      [`${formSelector} table tr:nth-of-type(3) input.form-control[size]`],
      targetPage,
      { timeout, visible: true }
    );

    await element.type(HOT_WATER_NEW_VALUE);
  }
  {
    const targetPage = page;
    const element = await waitForSelector(
      [
        `${formSelector} table tr:nth-of-type(3) input.form-control.datePickerStringInput`,
      ],
      targetPage,
      { timeout, visible: true }
    );
    await element.type(TODAY_DATE);
  }

  // Submit
  {
    const targetPage = page;
    const element = await waitForSelectors(
      [
        ['aria/Сохранить'],
        [
          'body > div.modal.fade.ng-isolate-scope.in > div > div > div > div.modal-footer.modal-base__footer > a.btn.btn-action',
        ],
      ],
      targetPage,
      { timeout, visible: true }
    );
    await scrollIntoViewIfNeeded(element, timeout);
    await element.click({ offset: { x: 45.5, y: 10.15625 } });
  }
  {
    const targetPage = page;
    const element = await waitForSelectors(
      [
        ['aria/ОК'],
        [
          'body > div.modal.fade.ng-isolate-scope.z-index-xxl.in > div > div > div > div.modal-footer.modal-base__footer.text-center > button > span',
        ],
      ],
      targetPage,
      { timeout, visible: true }
    );
    await scrollIntoViewIfNeeded(element, timeout);
    await element.click({ offset: { x: 14.34375, y: 13.40625 } });
  }

  await browser.close();
})();
