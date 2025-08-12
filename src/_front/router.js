import { createRouter, createWebHistory } from 'vue-router';

import wwPage from './views/wwPage.vue';

import { initializeData, initializePlugins, onPageUnload } from '@/_common/helpers/data';

let router;
const routes = [];

function scrollBehavior(to) {
    if (to.hash) {
        return {
            el: to.hash,
            behavior: 'smooth',
        };
    } else {
        return { top: 0 };
    }
}

 
/* wwFront:start */
import pluginsSettings from '../../plugins-settings.json';

// eslint-disable-next-line no-undef
window.wwg_designInfo = {"id":"d93a1b88-4f83-4782-a4d6-6bc9db5c53b3","homePageId":"043a5ae1-7e01-4e2f-b0fb-f5335c74f137","authPluginId":"1fa0dd68-5069-436c-9a7d-3b54c340f1fa","baseTag":{},"defaultTheme":"dark","langs":[{"lang":"en","default":false,"isDefaultPath":false},{"lang":"de","default":true,"isDefaultPath":true}],"background":{},"workflows":[{"id":"df3f773e-592b-4875-a702-6a53ce5d0665","name":"Subscribe to realtimehannels","actions":{"fba390f5-da03-4320-8cb3-478d68e4d94d":{"id":"fba390f5-da03-4320-8cb3-478d68e4d94d","args":{"type":"postgres_changes","event":"*","table":"vw_student_attendance_today","schema":"public","channel":"student_daily_log_updates"},"name":"Subscribe to daily log updates","next":null,"type":"f9ef41c3-1c53-4857-855b-f2f6a40b7186-subscribeToChannel","disabled":false,"description":"Subscribe to student daily log real-time updates","__wwdescription":"Subscribe to student daily log real-time updates"}},"trigger":"onload-app","firstAction":"fba390f5-da03-4320-8cb3-478d68e4d94d"}],"pages":[{"id":"aa72ba3f-f711-4879-97e1-9f66d3f97dba","linkId":"aa72ba3f-f711-4879-97e1-9f66d3f97dba","name":"Flex board","folder":null,"paths":{"de":"flex-board","default":"flex-board"},"langs":["en","de"],"cmsDataSetPath":null,"sections":[{"uid":"58e2b09f-3c0b-44f7-ae43-9e91190470f6","sectionTitle":"Section","linkId":"61519464-2e35-44f3-8921-aacda84f3dbc"}],"pageUserGroups":[],"title":{},"meta":{"desc":{},"keywords":{},"socialDesc":{},"socialTitle":{},"structuredData":{}},"metaImage":""},{"id":"66fee29d-3665-4488-a814-57f834211cdb","linkId":"66fee29d-3665-4488-a814-57f834211cdb","name":"Create parent account","folder":null,"paths":{"de":"create-parent-account","default":"create-parent-account"},"langs":["en","de"],"cmsDataSetPath":null,"sections":[{"uid":"1c569cb9-b7cc-4325-bfea-a1f44eb1de96","sectionTitle":"Create parent account alt","linkId":"51df1c37-3b35-468f-8a9e-1df052008a79"},{"uid":"3432f1fa-4999-4643-9d61-94a2ef3b4916","sectionTitle":"Create parent account","linkId":"407dd224-9014-4676-afcd-9d9582791c9d"}],"pageUserGroups":[],"title":{"en":"","fr":"Vide | Commencer à partir de zéro"},"meta":{"desc":{},"keywords":{},"socialDesc":{},"socialTitle":{},"structuredData":{}},"metaImage":""},{"id":"3cdb0b1f-fbba-4db7-825e-fcd59b8833e1","linkId":"3cdb0b1f-fbba-4db7-825e-fcd59b8833e1","name":"Accept staff invite","folder":null,"paths":{"de":"accept-staff-invite","en":"accept-staff-invite","default":"accept-staff-invite"},"langs":["en","de"],"cmsDataSetPath":null,"sections":[{"uid":"f3fd2069-8b0a-4a1e-973c-7bff367e6da5","sectionTitle":"Accept parent invite","linkId":"a310c505-58c5-4c88-9d6e-a6b5a1e149bb"}],"pageUserGroups":[],"title":{"en":"","fr":"Vide | Commencer à partir de zéro"},"meta":{"desc":{},"keywords":{},"socialDesc":{},"socialTitle":{},"structuredData":{}},"metaImage":""},{"id":"f7795d6a-1eec-4539-a51a-48dc65ba68f4","linkId":"f7795d6a-1eec-4539-a51a-48dc65ba68f4","name":"test","folder":null,"paths":{"de":"test","default":"test"},"langs":["en","de"],"cmsDataSetPath":null,"sections":[],"pageUserGroups":[],"title":{},"meta":{"desc":{},"keywords":{},"socialDesc":{},"socialTitle":{},"structuredData":{}},"metaImage":""},{"id":"615db87e-b05d-4409-8e84-ae0d69321839","linkId":"615db87e-b05d-4409-8e84-ae0d69321839","name":"Parent link student","folder":null,"paths":{"de":"parent-link-student","default":"parent-link-student"},"langs":["en","de"],"cmsDataSetPath":null,"sections":[{"uid":"b5482206-9374-471f-82fc-22b2c900843b","sectionTitle":"Accept parent invite","linkId":"0b2b0415-6b40-49ae-b063-1b58bdbd827f"}],"pageUserGroups":[],"title":{"en":"","fr":"Vide | Commencer à partir de zéro"},"meta":{"desc":{},"keywords":{},"socialDesc":{},"socialTitle":{},"structuredData":{}},"metaImage":""},{"id":"043a5ae1-7e01-4e2f-b0fb-f5335c74f137","linkId":"043a5ae1-7e01-4e2f-b0fb-f5335c74f137","name":"Login","folder":null,"paths":{"de":"home","en":"home","default":"home"},"langs":["en","de"],"cmsDataSetPath":null,"sections":[{"uid":"c7d79791-02ae-425a-9b56-e984bfcd4a65","sectionTitle":"Accept parent invite","linkId":"d7039aef-e715-4f20-8b64-6c48ba58c8da"}],"pageUserGroups":[],"title":{"en":"","fr":"Vide | Commencer à partir de zéro"},"meta":{"desc":{},"keywords":{},"socialDesc":{},"socialTitle":{},"structuredData":{}},"metaImage":""},{"id":"10bfa359-6f70-47b2-bf29-dc8317091cb2","linkId":"10bfa359-6f70-47b2-bf29-dc8317091cb2","name":"Dashboard Teacher","folder":null,"paths":{"de":"dashboard-teacher","en":"dashboard-teacher","default":"dashboard-teacher"},"langs":["de","en"],"cmsDataSetPath":null,"sections":[{"uid":"3eb47a16-4b38-46af-8f65-466a1292d473","sectionTitle":"Header Section","linkId":"61f67dc9-296e-47f9-a5dd-68696557d537"},{"uid":"2cabd779-f2fa-429b-9168-e49b36dde1a5","sectionTitle":"Main Content","linkId":"1f27cef2-0799-4a81-a143-1ea66c78068e"},{"uid":"7128309a-639a-40c0-abd9-8d30c634aa69","sectionTitle":"Child friendly attendance","linkId":"c8ca00ce-8655-4379-a016-0b4d43b49e5b"}],"pageUserGroups":[{}],"title":{},"meta":{"desc":{},"keywords":{},"socialDesc":{},"socialTitle":{},"structuredData":{}},"metaImage":""},{"id":"780eb2b9-9c07-4c69-8dbc-00aee443a526","linkId":"780eb2b9-9c07-4c69-8dbc-00aee443a526","name":"Dashboard Student","folder":null,"paths":{"de":"dashboard-student","en":"dashboard-student","default":"dashboard-student"},"langs":["en","de"],"cmsDataSetPath":null,"sections":[],"pageUserGroups":[{}],"title":{},"meta":{"desc":{},"keywords":{},"socialDesc":{},"socialTitle":{},"structuredData":{}},"metaImage":""},{"id":"aa9bc985-63ed-4aea-84c1-56259e85c983","linkId":"aa9bc985-63ed-4aea-84c1-56259e85c983","name":"Dashboard Parent","folder":null,"paths":{"de":"dashboard-parent","en":"dashboard-parent","default":"dashboard-parent"},"langs":["en","de"],"cmsDataSetPath":null,"sections":[{"uid":"2b5c4ae2-9c2d-4a1a-a79a-5be277f8e970","sectionTitle":"Header Section","linkId":"d6331c17-97d8-4ddf-9599-86aa2910d25e"},{"uid":"42bab14c-4fde-4a6b-85ef-58a849b10625","sectionTitle":"Main Content Section","linkId":"da097a50-4b17-4907-8182-5b767e783a5f"}],"pageUserGroups":[{}],"title":{},"meta":{"desc":{},"keywords":{},"socialDesc":{},"socialTitle":{},"structuredData":{}},"metaImage":""},{"id":"bad9e012-c9ee-47b8-87de-1b6bb17f8bab","linkId":"bad9e012-c9ee-47b8-87de-1b6bb17f8bab","name":"Accept parent invite","folder":null,"paths":{"de":"accept-parent-invite","en":"accept-parent-invite","default":"accept-parent-invite"},"langs":["en","de"],"cmsDataSetPath":null,"sections":[{"uid":"0ca50955-0796-41a3-a825-0b4e3eb08fd4","sectionTitle":"Accept parent invite","linkId":"d2b21f63-0191-4a09-bdb3-7e6a1500bdba"}],"pageUserGroups":[],"title":{"en":"","fr":"Vide | Commencer à partir de zéro"},"meta":{"desc":{},"keywords":{},"socialDesc":{},"socialTitle":{},"structuredData":{}},"metaImage":""},{"id":"5fe5c8f2-4c38-4459-b722-48bf993cfd52","linkId":"5fe5c8f2-4c38-4459-b722-48bf993cfd52","name":"Staff profile popup","folder":null,"paths":{"de":"staff-profile-popup","default":"staff-profile-popup"},"langs":["en","de"],"cmsDataSetPath":null,"sections":[],"pageUserGroups":[],"title":{},"meta":{"desc":{},"keywords":{},"socialDesc":{},"socialTitle":{},"structuredData":{}},"metaImage":""},{"id":"9a3bf52a-44ac-4098-934d-fb63b91ddb1f","linkId":"9a3bf52a-44ac-4098-934d-fb63b91ddb1f","name":"Dashboard Admin","folder":null,"paths":{"de":"dashboard-admin","en":"dashboard-admin","default":"dashboard-admin"},"langs":["de","en"],"cmsDataSetPath":null,"sections":[{"uid":"09d2ceb0-d073-48b7-bccf-2683cfccc111","sectionTitle":"Navigation","linkId":"285c735a-4910-41b2-b1f2-8ff834443e2f"},{"uid":"0a71d937-e51b-46a8-9e91-e3a6470acecb","sectionTitle":"Stecken","linkId":"7202004f-5a43-496f-a866-ea705c28bfee"},{"uid":"318f716a-652f-4527-b05a-9abe743cc316","sectionTitle":"Stundenplanung","linkId":"a01ace2b-b132-4de6-97aa-7a13ab4f8b26"},{"uid":"9317ab65-f297-4dc6-9d07-8dae74bb8bbd","sectionTitle":"Flex","linkId":"7eaab573-1164-4e86-841b-0cfc25a39259"},{"uid":"b40a8cef-f5b4-4aaa-b968-ebc4e145845b","sectionTitle":"Check in/out","linkId":"c008a593-3a24-4a29-8f7e-8d51355bfcf3"},{"uid":"2adc3cfb-2595-4591-98f7-902c7bfa71c9","sectionTitle":"Daily Overview Dashboard","linkId":"28e83360-bd7e-4e48-8efe-feda33be7b35"},{"uid":"5c0ba8dd-7fb7-4d13-8dc9-f0526a787b88","sectionTitle":"substitutePlanner","linkId":"5ea244a5-65c6-4c4f-9649-a782863de0ca"},{"uid":"fc516856-c0d6-4774-aada-e96bcccfc144","sectionTitle":"Course overview","linkId":"f65e05b8-4ecc-4c26-a524-c03b45527f5a"},{"uid":"4835ddc2-e8e7-40d4-b80a-9f82d0cf3228","sectionTitle":"Course Overview Section","linkId":"cb1f8d01-b10e-40a1-b514-7489dbcfd479"},{"uid":"5bb21cb5-528f-4c03-bff1-32f2678831ad","sectionTitle":"School Settings","linkId":"a72d3a8a-3e4d-4d8e-8b91-d71a2974a26e"},{"uid":"b2017841-7dd8-4cde-9f38-d012011f1332","sectionTitle":"Course edit","linkId":"dc31c76a-07a4-4eac-a662-a1097d217ff0"},{"uid":"e270126f-0751-4ba0-a660-ee04977bdd81","sectionTitle":"Alert","linkId":"5567c074-2a77-4964-9e00-3150efcb0c86"},{"uid":"5b7f9753-88de-4ead-8a9c-1c0d52ec43b0","sectionTitle":"Section add subject icon ","linkId":"15529023-5905-4b9a-b15d-637993af3ff6"}],"pageUserGroups":[{}],"title":{},"meta":{"desc":{},"keywords":{},"socialDesc":{},"socialTitle":{},"structuredData":{}},"metaImage":""}],"plugins":[{"id":"f9ef41c3-1c53-4857-855b-f2f6a40b7186","name":"Supabase","namespace":"supabase"},{"id":"1fa0dd68-5069-436c-9a7d-3b54c340f1fa","name":"Supabase Auth","namespace":"supabaseAuth"},{"id":"69d4a5bb-09a3-4f3d-a94e-667c21c057eb","name":"NPM","namespace":"npm"},{"id":"832d6f7a-42c3-43f1-a3ce-9a678272f811","name":"Date","namespace":"dayjs"},{"id":"2bd1c688-31c5-443e-ae25-59aa5b6431fb","name":"REST API","namespace":"restApi"}]};
// eslint-disable-next-line no-undef
window.wwg_cacheVersion = 37;
// eslint-disable-next-line no-undef
window.wwg_pluginsSettings = pluginsSettings;
// eslint-disable-next-line no-undef
window.wwg_disableManifest = false;

const defaultLang = window.wwg_designInfo.langs.find(({ default: isDefault }) => isDefault) || {};

const registerRoute = (page, lang, forcedPath) => {
    const langSlug = !lang.default || lang.isDefaultPath ? `/${lang.lang}` : '';
    let path =
        forcedPath ||
        (page.id === window.wwg_designInfo.homePageId ? '/' : `/${page.paths[lang.lang] || page.paths.default}`);

    //Replace params
    path = path.replace(/{{([\w]+)\|([^/]+)?}}/g, ':$1');

    routes.push({
        path: langSlug + path,
        component: wwPage,
        name: `page-${page.id}-${lang.lang}`,
        meta: {
            pageId: page.id,
            lang,
            isPrivate: !!page.pageUserGroups?.length,
        },
        async beforeEnter(to, from) {
            if (to.name === from.name) return;
            //Set page lang
            wwLib.wwLang.defaultLang = defaultLang.lang;
            wwLib.$store.dispatch('front/setLang', lang.lang);

            //Init plugins
            await initializePlugins();

            //Check if private page
            if (page.pageUserGroups?.length) {
                // cancel navigation if no plugin
                if (!wwLib.wwAuth.plugin) {
                    return false;
                }

                await wwLib.wwAuth.init();

                // Redirect to not sign in page if not logged
                if (!wwLib.wwAuth.getIsAuthenticated()) {
                    window.location.href = `${wwLib.wwPageHelper.getPagePath(
                        wwLib.wwAuth.getUnauthenticatedPageId()
                    )}?_source=${to.path}`;

                    return null;
                }

                //Check roles are required
                if (
                    page.pageUserGroups.length > 1 &&
                    !wwLib.wwAuth.matchUserGroups(page.pageUserGroups.map(({ userGroup }) => userGroup))
                ) {
                    window.location.href = `${wwLib.wwPageHelper.getPagePath(
                        wwLib.wwAuth.getUnauthorizedPageId()
                    )}?_source=${to.path}`;

                    return null;
                }
            }

            try {
                await import(`@/pages/${page.id.split('_')[0]}.js`);
                await wwLib.wwWebsiteData.fetchPage(page.id);

                //Scroll to section or on top after page change
                if (to.hash) {
                    const targetElement = document.getElementById(to.hash.replace('#', ''));
                    if (targetElement) targetElement.scrollIntoView();
                } else {
                    document.body.scrollTop = document.documentElement.scrollTop = 0;
                }

                return;
            } catch (err) {
                wwLib.$store.dispatch('front/showPageLoadProgress', false);

                if (err.redirectUrl) {
                    return { path: err.redirectUrl || '404' };
                } else {
                    //Any other error: go to target page using window.location
                    window.location = to.fullPath;
                }
            }
        },
    });
};

for (const page of window.wwg_designInfo.pages) {
    for (const lang of window.wwg_designInfo.langs) {
        if (!page.langs.includes(lang.lang)) continue;
        registerRoute(page, lang);
    }
}

const page404 = window.wwg_designInfo.pages.find(page => page.paths.default === '404');
if (page404) {
    for (const lang of window.wwg_designInfo.langs) {
        // Create routes /:lang/:pathMatch(.*)* etc for all langs of the 404 page
        if (!page404.langs.includes(lang.lang)) continue;
        registerRoute(
            page404,
            {
                default: false,
                lang: lang.lang,
            },
            '/:pathMatch(.*)*'
        );
    }
    // Create route /:pathMatch(.*)* using default project lang
    registerRoute(page404, { default: true, isDefaultPath: false, lang: defaultLang.lang }, '/:pathMatch(.*)*');
} else {
    routes.push({
        path: '/:pathMatch(.*)*',
        async beforeEnter() {
            window.location.href = '/404';
        },
    });
}

let routerOptions = {};

const isProd =
    !window.location.host.includes(
        // TODO: add staging2 ?
        '-staging.' + (process.env.WW_ENV === 'staging' ? import.meta.env.VITE_APP_PREVIEW_URL : '')
    ) && !window.location.host.includes(import.meta.env.VITE_APP_PREVIEW_URL);

if (isProd && window.wwg_designInfo.baseTag?.href) {
    let baseTag = window.wwg_designInfo.baseTag.href;
    if (!baseTag.startsWith('/')) {
        baseTag = '/' + baseTag;
    }
    if (!baseTag.endsWith('/')) {
        baseTag += '/';
    }

    routerOptions = {
        base: baseTag,
        history: createWebHistory(baseTag),
        routes,
    };
} else {
    routerOptions = {
        history: createWebHistory(),
        routes,
    };
}

router = createRouter({
    ...routerOptions,
    scrollBehavior,
});

//Trigger on page unload
let isFirstNavigation = true;
router.beforeEach(async (to, from) => {
    if (to.name === from.name) return;
    if (!isFirstNavigation) await onPageUnload();
    isFirstNavigation = false;
    wwLib.globalVariables._navigationId++;
    return;
});

//Init page
router.afterEach((to, from, failure) => {
    wwLib.$store.dispatch('front/showPageLoadProgress', false);
    let fromPath = from.path;
    let toPath = to.path;
    if (!fromPath.endsWith('/')) fromPath = fromPath + '/';
    if (!toPath.endsWith('/')) toPath = toPath + '/';
    if (failure || (from.name && toPath === fromPath)) return;
    initializeData(to);
});
/* wwFront:end */

export default router;
