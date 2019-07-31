[@bs.module "util"]
external promisify:
  (('a, (Js.Exn.t, 'b) => unit) => unit) => (. 'a) => Js.Promise.t('b) =
  "promisify";
