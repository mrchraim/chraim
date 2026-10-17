// ==========================================================================
// موجّه مسارات بسيط (Method + Path + :params) بدون تبعيات.
// ==========================================================================

function compile(pattern) {
  const keys = [];
  const regexSource = pattern
    .split('/')
    .map((segment) => {
      if (segment.startsWith(':')) {
        keys.push(segment.slice(1));
        return '([^/]+)';
      }
      if (segment === '*') {
        keys.push('wildcard');
        return '(.*)';
      }
      return segment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    })
    .join('/');
  return { regex: new RegExp(`^${regexSource}/?$`), keys };
}

export class Router {
  constructor() {
    this.routes = [];
    this.middlewares = [];
  }

  /** تسجيل وسيط عام يُنفَّذ قبل كل مسار مطابق. */
  use(fn) {
    this.middlewares.push(fn);
    return this;
  }

  add(method, pattern, ...handlers) {
    this.routes.push({ method, ...compile(pattern), handlers });
    return this;
  }

  get(p, ...h) { return this.add('GET', p, ...h); }
  post(p, ...h) { return this.add('POST', p, ...h); }
  put(p, ...h) { return this.add('PUT', p, ...h); }
  patch(p, ...h) { return this.add('PATCH', p, ...h); }
  delete(p, ...h) { return this.add('DELETE', p, ...h); }

  match(method, pathname) {
    for (const route of this.routes) {
      if (route.method !== method) continue;
      const m = route.regex.exec(pathname);
      if (!m) continue;
      const params = {};
      route.keys.forEach((key, i) => { params[key] = m[i + 1]; });
      return { params, handlers: [...this.middlewares, ...route.handlers] };
    }
    return null;
  }
}

/** تشغيل سلسلة معالجات بالتتابع مع دعم async. */
export async function runChain(ctx, handlers) {
  let index = 0;
  const next = async (err) => {
    if (err) throw err;
    const handler = handlers[index++];
    if (!handler) return;
    await handler(ctx, next);
  };
  await next();
}

export class HttpError extends Error {
  constructor(status, message, extra) {
    super(message);
    this.status = status;
    this.extra = extra;
  }
}
