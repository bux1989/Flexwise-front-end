
export default {
    async onLoad(settings) {
        await this.addScripts(settings.publicData?.packages, wwLib.getFrontDocument());
    },

    reloadPackages(settings) {
        this.onLoad(settings);
    },

    addScript(packageItem, context) {
        return new Promise((resolve, reject) => {
            const packageSrc = `https://unpkg.com/${packageItem.name}@${packageItem.version}`;
            const script = context.createElement('script');
            script.type = 'text/javascript';
            script.src = packageSrc;

            script.onload = () => {
                this.updatePluginVariables(packageItem.name, packageItem.instanceName);
                resolve();
            };

            script.onerror = () => {
                reject();
            };

            context.head.appendChild(script);
        });
    },

    updatePluginVariables(packageName, instanceName) {

        wwLib.wwVariable.updateValue(`${this.id}-${packageName}`, wwLib.getFrontWindow()[instanceName]);
    },

    addScripts(packages = [], context) {
        const promises = [];

        for (const packageItem of Array.isArray(packages) ? packages : []) {
            promises.push(this.addScript(packageItem, context));
        }

        return Promise.all(promises);
    },
};
