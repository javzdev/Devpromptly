require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const Forum = require('./models/Forum');

const forums = [
  // ── REDDIT ────────────────────────────────────────────────────────────────
  { name: 'r/SideProject',             url: 'https://www.reddit.com/r/SideProject/',                        language: 'en', description: 'Comunidad dedicada a compartir y descubrir proyectos personales. Los miembros muestran sus creaciones, piden retroalimentación y apoyo. Uno de los mejores lugares para visibilidad inicial.' },
  { name: 'r/webdev',                  url: 'https://www.reddit.com/r/webdev/',                             language: 'en', description: 'Subreddit muy activo sobre desarrollo web (front-end y back-end). Ideal para compartir proyectos web, herramientas, tutoriales y obtener críticas constructivas de más de 3 millones de miembros.' },
  { name: 'r/programming',             url: 'https://www.reddit.com/r/programming/',                        language: 'en', description: 'Uno de los subreddits más grandes de programación con más de 6.8M miembros. Se discuten tendencias, proyectos, artículos técnicos y novedades del mundo del software.' },
  { name: 'r/gamedev',                 url: 'https://www.reddit.com/r/gamedev/',                            language: 'en', description: 'Comunidad para desarrolladores de videojuegos con más de 1.9M miembros. Ideal para compartir juegos en desarrollo, prototipos, game jams y pedir feedback sobre mecánicas o diseño.' },
  { name: 'r/learnprogramming',        url: 'https://www.reddit.com/r/learnprogramming/',                   language: 'en', description: 'Espacio para quienes están aprendiendo a programar. Permite compartir proyectos de aprendizaje, pedir code reviews y recibir orientación de desarrolladores más experimentados.' },
  { name: 'r/androiddev',             url: 'https://www.reddit.com/r/androiddev/',                         language: 'en', description: 'Subreddit especializado en el desarrollo de aplicaciones Android con más de 260K miembros. Se pueden compartir apps publicadas o en desarrollo y obtener retroalimentación técnica.' },
  { name: 'r/iOSProgramming',         url: 'https://www.reddit.com/r/iOSProgramming/',                     language: 'en', description: 'Comunidad de más de 114K desarrolladores de iOS, macOS, watchOS y tvOS. Permite compartir proyectos de aplicaciones Apple, código fuente abierto y recursos de aprendizaje.' },
  { name: 'r/MachineLearning',        url: 'https://www.reddit.com/r/MachineLearning/',                    language: 'en', description: 'Foro para investigadores y desarrolladores de IA y aprendizaje automático. Se comparten papers, proyectos propios, modelos entrenados y herramientas relacionadas con ML/AI.' },
  { name: 'r/Python',                 url: 'https://www.reddit.com/r/Python/',                             language: 'en', description: 'Una de las comunidades de lenguaje de programación más grandes de Reddit. Perfecta para compartir proyectos, scripts, librerías y herramientas hechas en Python.' },
  { name: 'r/javascript',             url: 'https://www.reddit.com/r/javascript/',                         language: 'en', description: 'Comunidad dedicada al ecosistema JavaScript. Se comparten proyectos web, paquetes npm, frameworks, herramientas de desarrollo y experimentos con JavaScript moderno.' },
  { name: 'r/startups',              url: 'https://www.reddit.com/r/startups/',                            language: 'en', description: 'Subreddit para emprendedores y fundadores donde se pueden presentar proyectos con potencial comercial, pedir retroalimentación sobre ideas de negocio y conectar con otros builders.' },
  { name: 'r/opensource',            url: 'https://www.reddit.com/r/opensource/',                          language: 'en', description: 'Comunidad enfocada en proyectos de código abierto. Permite que los desarrolladores presenten sus repositorios, busquen colaboradores y discutan sobre herramientas open-source.' },
  { name: 'r/reactjs',               url: 'https://www.reddit.com/r/reactjs/',                             language: 'en', description: 'Comunidad de desarrollo con React. Se pueden mostrar proyectos construidos con React, pedir opiniones sobre arquitecturas, componentes y obtener feedback técnico especializado.' },
  { name: 'r/programacion',          url: 'https://www.reddit.com/r/programacion/',                        language: 'es', description: 'Subreddit en español para programadores hispanohablantes. Se pueden compartir proyectos, hacer preguntas técnicas y discutir sobre tecnología y desarrollo de software en general.' },
  { name: 'r/es_progr',              url: 'https://www.reddit.com/r/es_progr/',                            language: 'es', description: 'Comunidad de programación en español para desarrolladores de habla hispana. Orientada al aprendizaje colaborativo y la presentación de proyectos personales y del trabajo.' },

  // ── DISCORD ───────────────────────────────────────────────────────────────
  { name: "Programmer's Hangout",     url: 'https://discord.gg/programming',                               language: 'en', description: 'Uno de los servidores de Discord para programadores más grandes del mundo. Cuenta con canales dedicados para mostrar proyectos, obtener code reviews y colaborar con miles de desarrolladores.' },
  { name: 'Python Discord',           url: 'https://discord.gg/python',                                    language: 'en', description: 'Servidor oficial de la comunidad Python con más de 170K miembros. Ofrece canales dedicados para compartir proyectos Python, discutir librerías y obtener feedback especializado.' },
  { name: 'The Coding Den',           url: 'https://discord.gg/code',                                      language: 'en', description: 'Comunidad activa donde desarrolladores de todos los niveles pueden mostrar sus proyectos, pedir ayuda técnica y participar en retos de programación y eventos de codificación.' },
  { name: 'Reactiflux',               url: 'https://discord.gg/reactiflux',                                language: 'en', description: 'El servidor oficial de Discord para la comunidad de React con más de 200K miembros. Ideal para compartir proyectos con React, Redux, Next.js y el ecosistema moderno de JS.' },
  { name: 'Rootware Dev Community',   url: 'https://discord.gg/rootware',                                  language: 'en', description: 'Comunidad global para desarrolladores de todos los niveles. Incluye canales para mostrar proyectos, encontrar colaboradores, participar en hackathons y recibir feedback de pares.' },
  { name: 'Indie Hackers Discord',    url: 'https://discord.gg/indiehackers',                              language: 'en', description: 'Servidor de Discord asociado a la plataforma Indie Hackers. Comunidad de makers que construyen startups y proyectos independientes y comparten su progreso entre pares.' },
  { name: 'Hugging Face Discord',     url: 'https://discord.gg/huggingface',                               language: 'en', description: 'Servidor oficial de Hugging Face, la plataforma de ML de código abierto. Perfecto para compartir proyectos de inteligencia artificial, modelos entrenados y experimentos con datos.' },
  { name: 'OpenAI Community Discord', url: 'https://discord.gg/openai',                                    language: 'en', description: 'Comunidad oficial de OpenAI en Discord. Canales para desarrolladores que usan la API, comparten proyectos con ChatGPT, DALL-E y otras herramientas de IA.' },
  { name: 'Devcord',                  url: 'https://discord.gg/devcord',                                   language: 'en', description: 'Servidor de Discord enfocado en desarrollo web y móvil. Tiene canales para compartir portafolios y proyectos, oportunidades de colaboración y discusiones técnicas profundas.' },
  { name: 'Code Workshop',            url: 'https://discord.me/code-workshop',                              language: 'en', description: 'Comunidad de aprendizaje y práctica de programación que abarca desde desarrollo web hasta ML y robótica. Incluye canales para compartir proyectos y recibir retroalimentación.' },
  { name: 'HispaDev',                 url: 'https://discord.gg/hispadev',                                  language: 'es', description: 'Servidor de Discord en español para la comunidad de desarrolladores hispanohablantes. Canales para mostrar proyectos, hacer preguntas técnicas y conectar con devs de Latinoamérica y España.' },
  { name: 'Makers Latinoamérica',     url: 'https://discord.gg/makerslatam',                               language: 'es', description: 'Comunidad en Discord para constructores, makers y emprendedores tecnológicos de América Latina. Se comparten proyectos, ideas de startups y se buscan colaboradores en la región.' },

  // ── FOROS / PLATAFORMAS ───────────────────────────────────────────────────
  { name: 'Stack Overflow',           url: 'https://stackoverflow.com/',                                   language: 'en', description: 'La comunidad de preguntas y respuestas más grande del mundo para programadores. Se puede compartir código, proyectos personales y participar en discusiones técnicas con millones de devs.' },
  { name: 'DEV.to',                   url: 'https://dev.to/',                                              language: 'en', description: 'Plataforma colaborativa donde millones de desarrolladores escriben artículos, comparten proyectos y discuten tendencias tecnológicas. Muy orientada a la comunidad y el aprendizaje.' },
  { name: 'Hashnode',                 url: 'https://hashnode.com/',                                        language: 'en', description: 'Plataforma de blogging y comunidad para desarrolladores. Permite publicar sobre proyectos propios, experiencias y tutoriales técnicos con acceso a una audiencia global de devs.' },
  { name: 'Hacker News – Show HN',    url: 'https://news.ycombinator.com/show',                            language: 'en', description: 'La sección Show HN de Hacker News es el lugar canónico para presentar proyectos personales a una audiencia técnica muy exigente. Un post exitoso puede generar miles de visitas en horas.' },
  { name: 'Product Hunt',             url: 'https://www.producthunt.com/',                                 language: 'en', description: 'La plataforma de lanzamiento de productos más reconocida del mundo tech. Permite que creadores presenten sus apps, herramientas y proyectos para ser votados y descubiertos por la comunidad.' },
  { name: 'Indie Hackers',            url: 'https://www.indiehackers.com/',                                language: 'en', description: 'Comunidad de fundadores independientes que construyen proyectos y negocios pequeños. Se comparten ingresos, métricas, estrategias y se buscan co-fundadores o colaboradores.' },
  { name: 'GitHub',                   url: 'https://github.com/',                                          language: 'en', description: 'La red social de código más grande del mundo. Permite hospedar proyectos, colaborar mediante issues y pull requests, y conectar con millones de desarrolladores que pueden descubrir tu trabajo.' },
  { name: 'CodePen',                  url: 'https://codepen.io/',                                          language: 'en', description: 'Plataforma social para desarrolladores front-end donde se pueden compartir snippets, proyectos de CSS, animaciones y experimentos creativos con HTML/CSS/JS de forma interactiva.' },
  { name: 'HackerNoon',               url: 'https://hackernoon.com/',                                      language: 'en', description: 'Plataforma de publicación para tecnólogos donde se pueden compartir historias sobre proyectos que se están construyendo, lecciones aprendidas y opiniones técnicas con audiencia global.' },
  { name: 'Lobste.rs',                url: 'https://lobste.rs/',                                           language: 'en', description: 'Foro de tecnología y programación enfocado en calidad, con sistema de invitaciones. Permite compartir proyectos técnicos y artículos ante una audiencia de desarrolladores muy comprometida.' },
  { name: 'BetaList',                 url: 'https://betalist.com/',                                        language: 'en', description: 'Directorio de startups y proyectos en fase beta. Permite registrar proyectos en desarrollo para ganar early adopters, feedback temprano y visibilidad ante una comunidad de tech enthusiasts.' },
  { name: 'Kaggle',                   url: 'https://www.kaggle.com/',                                      language: 'en', description: 'La mayor comunidad de ciencia de datos y ML del mundo con 15M+ usuarios. Permite compartir notebooks, modelos, datasets y proyectos de ML con retroalimentación especializada.' },
  { name: 'Stack Overflow en Español', url: 'https://es.stackoverflow.com/',                               language: 'es', description: 'La versión en español de Stack Overflow. Una de las comunidades más activas de programación en español donde se pueden compartir proyectos, resolver dudas y participar en discusiones técnicas.' },
  { name: 'Foros del Web',            url: 'https://www.forosdelweb.com/',                                 language: 'es', description: 'Uno de los foros de programación en español más antiguos y con mayor trayectoria. Comunidad muy activa de desarrolladores hispanos que comparten proyectos y resuelven dudas de PHP, JS, CSS y más.' },
  { name: 'La Web del Programador',   url: 'https://www.lawebdelprogramador.com/',                         language: 'es', description: 'Comunidad hispana de programación de larga trayectoria. Ofrece foros, tutoriales y espacios para que programadores de todos los niveles compartan sus proyectos y creaciones.' },
  { name: 'HolaCode',                 url: 'https://holacode.com/',                                        language: 'es', description: 'Plataforma de tutoriales y comunidad de programación en español donde puedes hacer preguntas, compartir blogs y crear o buscar proyectos. Enfocada en la comunidad latinoamericana.' },

  // ── FACEBOOK ──────────────────────────────────────────────────────────────
  { name: 'Programmer Hub (FB)',      url: 'https://www.facebook.com/groups/programmerhub/',               language: 'en', description: 'Grupo de Facebook masivo para programadores de todos los niveles. Se permiten publicaciones de proyectos personales, solicitudes de colaboración y discusiones sobre herramientas y tecnologías.' },
  { name: 'Web Developers (FB)',      url: 'https://www.facebook.com/groups/webdevelopers/',               language: 'en', description: 'Gran comunidad de Facebook enfocada en desarrollo web. Ideal para compartir proyectos web, buscar colaboradores front-end/back-end y discutir tendencias del ecosistema web.' },
  { name: 'JavaScript Dev Community', url: 'https://www.facebook.com/groups/JavaScriptDev/',               language: 'en', description: 'Grupo de Facebook dedicado al ecosistema JavaScript. Permite mostrar proyectos y herramientas construidos con JS, React, Vue, Node.js y recibir retroalimentación de desarrolladores activos.' },
  { name: 'Programadores Web Hispanos', url: 'https://www.facebook.com/groups/programadores.web.hispanos/', language: 'es', description: 'Comunidad de Facebook en español para desarrolladores web de Latinoamérica y España. Espacio para compartir proyectos, pedir ayuda técnica y encontrar colaboradores dentro de la comunidad hispana.' },
  { name: 'Desarrolladores de Software', url: 'https://www.facebook.com/groups/desarrolladoressoftware/',  language: 'es', description: 'Grupo de Facebook en español para profesionales y aficionados al desarrollo de software. Se comparten proyectos personales, recursos educativos y oportunidades laborales en habla hispana.' },

  // ── OTROS ─────────────────────────────────────────────────────────────────
  { name: 'LinkedIn Developer Groups', url: 'https://www.linkedin.com/groups/',                            language: 'en', description: 'LinkedIn alberga miles de grupos de desarrolladores donde se pueden compartir proyectos profesionales, artículos técnicos y conectar con reclutadores y empresas del sector tecnológico.' },
  { name: 'Makerlog',                 url: 'https://getmakerlog.com/',                                     language: 'en', description: 'Red social para makers e indie hackers donde se registran actualizaciones diarias de proyectos en desarrollo. Fomenta la transparencia y el progreso público (build in public) con una comunidad muy activa.' },
];

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
  console.log('Connected to MongoDB\n');

  let added = 0, skipped = 0;
  for (const f of forums) {
    const exists = await Forum.findOne({ name: f.name });
    if (exists) {
      skipped++;
      console.log(`  SKIP  ${f.name}`);
    } else {
      await Forum.create({ ...f, isActive: true });
      added++;
      console.log(`  ADD   ${f.name}`);
    }
  }

  console.log(`\nDone: ${added} added, ${skipped} skipped`);
  await mongoose.disconnect();
}

seed().catch(err => { console.error(err); process.exit(1); });
