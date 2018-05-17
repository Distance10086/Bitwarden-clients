import * as program from 'commander';

import { CipherService } from 'jslib/abstractions/cipher.service';
import { FolderService } from 'jslib/services/folder.service';

import { Response } from '../models/response';

import { Cipher } from '../models/cipher';
import { Folder } from '../models/folder';

import { CliUtils } from 'src/utils';

export class EditCommand {
    constructor(private cipherService: CipherService, private folderService: FolderService) { }

    async run(object: string, id: string, requestJson: string, cmd: program.Command): Promise<Response> {
        if (requestJson == null || requestJson === '') {
            requestJson = await CliUtils.readStdin();
        }

        if (requestJson == null || requestJson === '') {
            return Response.badRequest('`requestJson` was not provided.');
        }

        let req: any = null;
        try {
            const reqJson = new Buffer(requestJson, 'base64').toString();
            req = JSON.parse(reqJson);
        } catch (e) {
            return Response.badRequest('Error parsing the encoded request data.');
        }

        if (id != null) {
            id = id.toLowerCase();
        }

        switch (object.toLowerCase()) {
            case 'item':
                return await this.editCipher(id, req);
            case 'folder':
                return await this.editFolder(id, req);
            default:
                return Response.badRequest('Unknown object.');
        }
    }

    private async editCipher(id: string, req: Cipher) {
        const cipher = await this.cipherService.get(id);
        if (cipher == null) {
            return Response.notFound();
        }

        let cipherView = await cipher.decrypt();
        cipherView = Cipher.toView(req, cipherView);
        const encCipher = await this.cipherService.encrypt(cipherView);
        try {
            await this.cipherService.saveWithServer(encCipher);
            return Response.success();
        } catch (e) {
            return Response.error(e);
        }
    }

    private async editFolder(id: string, req: Folder) {
        const folder = await this.folderService.get(id);
        if (folder == null) {
            return Response.notFound();
        }

        let folderView = await folder.decrypt();
        folderView = Folder.toView(req, folderView);
        const encFolder = await this.folderService.encrypt(folderView);
        try {
            await this.folderService.saveWithServer(encFolder);
            return Response.success();
        } catch (e) {
            return Response.error(e);
        }
    }
}
