import { apply, chain, forEach, MergeStrategy, mergeWith, renameTemplateFiles, Rule, SchematicContext, template, Tree, UpdateRecorder, url } from '@angular-devkit/schematics';
import { addSymbolToNgModuleMetadata, insertImport, isImported } from '@schematics/angular/utility/ast-utils';

import { getFileInfo, getTemplateFolder, ngAddPackages } from '@o3r/schematics';
import { InsertChange } from '@schematics/angular/utility/change';

/**
 * Enable customization capabilities
 *
 * @param rootPath @see RuleFactory.rootPath
 * @param o3rCoreVersion
 * @param _options
 */
export function updateCustomizationEnvironment(rootPath: string, o3rCoreVersion?: string, _options?: { projectName: string | null }): Rule {
  /**
   * Generate customization folder
   *
   * @param tree
   * @param context
   */
  const generateC11nFolder = (tree: Tree, context: SchematicContext) => {

    if (tree.exists('src/customization/presenters-map.empty.ts')) {
      return tree;
    }
    const templateSource = apply(
      url(getTemplateFolder(rootPath, __dirname)),
      [
        template({}),
        renameTemplateFiles(),
        forEach((fileEntry) => {
          if (tree.exists(fileEntry.path)) {
            if (fileEntry.path.indexOf('presenters-map.empty') > -1) {
              tree.delete(fileEntry.path);
              return fileEntry;
            }
            return null;
          }
          return fileEntry;
        })
      ]
    );

    const rule = mergeWith(templateSource, MergeStrategy.Default);
    return rule(tree, context);
  };

  /**
   * Edit main module with the customization required information
   *
   * @param tree
   * @param context
   */
  const registerModules: Rule = (tree: Tree, context: SchematicContext) => {
    const fileInfo = getFileInfo(tree, context);
    if (!fileInfo.moduleFilePath || !fileInfo.appModuleFile || !fileInfo.sourceFile) {
      return tree;
    }

    // if we already have the customization module imported do nothing to avoid overriding custom configs with the empty ones
    if (isImported(fileInfo.sourceFile, 'C11nModule', '@otter/common') || isImported(fileInfo.sourceFile, 'C11nModule', '@o3r/components')) {
      return tree;
    }

    const recorder = tree.beginUpdate(fileInfo.moduleFilePath);
    const moduleIndex = fileInfo.ngModulesMetadata && fileInfo.ngModulesMetadata[0] ?
      fileInfo.ngModulesMetadata[0].pos - ('NgModule'.length + 1) : fileInfo.appModuleFile.indexOf('@NgModule');

    /**
     * Insert import on top of the main module file
     *
     * @param rec
     * @param name
     * @param file
     * @param isDefault
     */
    const insertImportToModuleFile = (rec: UpdateRecorder, name: string, file: string, isDefault?: boolean) => {
      const importChange = insertImport(fileInfo.sourceFile!, fileInfo.moduleFilePath!, name, file, isDefault);
      if (importChange instanceof InsertChange) {
        return rec.insertLeft(importChange.pos, importChange.toAdd);
      }
      return rec;
    };

    /**
     * Add elements in the metadata of the ngModule (entryComponents, imports etc.)
     *
     * @param rec
     * @param metadataField
     * @param name
     */
    const addToNgModuleMetadata = (rec: UpdateRecorder, metadataField: string, name: string) => {
      addSymbolToNgModuleMetadata(fileInfo.sourceFile!, fileInfo.moduleFilePath!, metadataField, name)
        .forEach((change) => {
          if (change instanceof InsertChange) {
            rec = rec.insertLeft(change.pos, change.toAdd);
          }});
      return rec;
    };

    /**
     * Add custom code before the module definition
     *
     * @param rec
     * @param line
     */
    const insertBeforeModule = (rec: UpdateRecorder, line: string) => {
      const buffer = tree.read(fileInfo.moduleFilePath!);
      const content = buffer ? buffer.toString().replace(/[\r\n ]*/g, '') : '';
      if (content.indexOf(line.replace(/[\r\n ]*/g, '')) === -1) {
        return rec.insertLeft(moduleIndex - 1, `${line}\n\n`);
      }
      return rec;
    };

    let updatedRecorder = recorder;

    updatedRecorder = insertImportToModuleFile(updatedRecorder, 'initializeEntryComponents', '../customization/presenters-map.empty');
    updatedRecorder = insertImportToModuleFile(updatedRecorder, 'registerCustomComponents', '../customization/presenters-map.empty');
    updatedRecorder = insertImportToModuleFile(updatedRecorder, 'Provider', '@angular/core');
    updatedRecorder = insertImportToModuleFile(updatedRecorder, 'initializeCustomProviders', '../customization/custom-providers.empty');

    updatedRecorder = addToNgModuleMetadata(updatedRecorder, 'imports', '...entry.customComponentsModules');
    updatedRecorder = addToNgModuleMetadata(updatedRecorder, 'entryComponents', '...entry.customComponents');
    updatedRecorder = addToNgModuleMetadata(updatedRecorder, 'providers', '...customProviders');
    updatedRecorder = addToNgModuleMetadata(updatedRecorder, 'imports', 'C11nModule.forRoot({registerCompFunc: registerCustomComponents})');
    updatedRecorder = insertImportToModuleFile(updatedRecorder, 'C11nModule', '@o3r/components');

    updatedRecorder = insertBeforeModule(updatedRecorder, 'const entry = initializeEntryComponents();');

    updatedRecorder = insertBeforeModule(updatedRecorder, 'const customProviders: Provider[] = initializeCustomProviders();');

    tree.commitUpdate(updatedRecorder);

    return tree;
  };

  return chain([
    generateC11nFolder,
    registerModules,
    ngAddPackages(['@o3r/components', '@o3r/configuration'], {skipConfirmation: true, version: o3rCoreVersion, parentPackageInfo: '@o3r/core - customization environment update'})
  ]);
}
