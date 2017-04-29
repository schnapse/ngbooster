/**
 * Created by Trajan on 24/04/2017.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as rimraf from 'rimraf';
import {CAMEL_NAME, CAMEL_NAME_FIRST_UP, DASH_NAME, INPUTS, OUTPUTS, REPLACEMENTS_MAP} from './replacements-map';
import {StringHelper} from './string-helper';
import {COMPONENT, GeneratedType, HTML, MODULE, SASS, SPEC, STORE, TYPES_MAP} from './types-map';

export interface IComponent {
    children?: IComponent[];
    inputList?: string[];
    name: string;
    outputList?: string[];
    retrievesDataFrom?: IStore[];
}

export interface IStore {
    name: string;
    canDelete?: boolean;
    canGet?: boolean;
    canPatch?: boolean;
    canPut?: boolean;
}

export interface IGeneratedTypeInfos {
    fileLabelAdditional: string;
    name: string;
    templateFile: string;
}

const APP_PREFIX: string = 'ei';

class Generator {

    componentTree: IComponent[] = [{
        name: 'connection-list-container',
        children: [{
            name: 'connection-list',
            children: [{
                name: 'connection-preview',
                inputList: ['connection'],
                outputList: ['onAccountClick']
            }]
        }],
        retrievesDataFrom: [{
            name: 'connection',
            canGet: true,
            canPatch: false
        }]
    }];

    typesMap: Map<GeneratedType, IGeneratedTypeInfos> = TYPES_MAP;

    outputDirName: string = 'output';
    outputDir: string = 'C:/Windows/Temp';
    rootDir: string = '';

    replacements: Map<string, string>;

    constructor() {
        StringHelper.extendString();

        this.rootDir = path.dirname(require.main.filename);
        this.outputDir = this.rootDir;
        this.replacements = REPLACEMENTS_MAP;
    }

    generate(): void {
        process.chdir(this.outputDir);
        if (fs.existsSync(this.outputDirName)) {
            rimraf.sync(this.outputDirName);
        }
        fs.mkdirSync(this.outputDirName);
        process.chdir(this.outputDirName);
        this.componentTree.forEach(comp => {
            this.dealWithComponent(comp);
        });
    }

    dealWithComponent(comp: IComponent): void {
        console.log(`Generating ${comp.name}`);
        this.replacements.set(DASH_NAME, comp.name);
        this.replacements.set(CAMEL_NAME, comp.name.replaceAll('-', ''));
        this.replacements.set(CAMEL_NAME_FIRST_UP, comp.name.replaceAll('-', ''));
        this.replacements.set(INPUTS, this.generateInputs(comp.inputList));
        this.replacements.set(OUTPUTS, this.generateOutputs(comp.outputList));

        this.generateFiles(comp.name);
        if (comp.retrievesDataFrom != null) {
            comp.retrievesDataFrom.forEach(store => this.dealWithStore(store));
        }
        if (comp.children != null) {
            comp.children.forEach(child => this.dealWithComponent(child));
        }
    }

    dealWithStore(store: IStore) {
        this.generateFileAndReplace(store.name, this.typesMap.get(STORE));
    }

    generateFiles(name: string): void {
        fs.mkdirSync(name);
        process.chdir(name);
        this.generateFileAndReplace(name, this.typesMap.get(COMPONENT));
        this.generateFileAndReplace(name, this.typesMap.get(HTML));
        this.generateFileAndReplace(name, this.typesMap.get(MODULE));
        this.generateFileAndReplace(name, this.typesMap.get(SASS));
        this.generateFileAndReplace(name, this.typesMap.get(SPEC));
    }

    generateFileAndReplace(name: string, generatedType: IGeneratedTypeInfos): void {

        let content: string = fs.readFileSync(this.rootDir + '/templates/' + generatedType.templateFile).toString();
        let replacedContent: string = this.replaceTemplateWithName(content, this.replacements);
        fs.writeFileSync(name + generatedType.fileLabelAdditional, replacedContent);

    }

    replaceTemplateWithName(template: string, replacements: Map<string, string>): string {

        let initTemplate: string = template;

        replacements.forEach((value: string, key: string) => {
            initTemplate = initTemplate.replaceAll(key, value);
        });

        return initTemplate;
    }

    generateInputs(inputList: string[]): string {
        return this.generateBindings(inputList, '<');
    }

    generateOutputs(outputList: string[]): string {
        return this.generateBindings(outputList, '&');
    }

    generateBindings(list: string[], prefix: string): string {

        if (list == null || list.length === 0) {
            return '';
        }

        return list
            .map(element => "'"+element+"': '" + prefix + APP_PREFIX + 'CamelFirstUp' + "'")
            .join(',');
    }
}

new Generator().generate();
