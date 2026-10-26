// nodemailer ships no bundled types and the @types resolution is unreliable in
// the CI build (Render falls through to the raw .js and errors on the dynamic
// import). Declare the module so TypeScript resolves the specifier to `any`
// regardless of whether @types/nodemailer is installed. The only API we use is
// createTransport().sendMail(), so the loose typing is acceptable here.
declare module 'nodemailer';
