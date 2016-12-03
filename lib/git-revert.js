var $ = require('jquery');
var _ = require('underscore');
var html = $(require('./html.js'));
var panel;
var editor;
var destroyPanel = function () {
    html.off('click');
    if (panel) {
        panel.destroy();
    }
    if (editor) {
        $(editor.editorElement).removeClass('git-revert-active');
    }
};
var revert = function (path) {
    var currentPath;

    if (path) {
        //if we supplied a path use it straight up
        currentPath = path;
    } else {
        //else find the editor with focus and use that file
        editor = atom.workspace.getActiveTextEditor();
        currentPath = editor.getPath();
    }

    var rPath = atom.project.relativizePath(currentPath),
        justFilePath = rPath[1],
        repo = _.filter(atom.project.getRepositories(), function (_dir) {
            return _dir.getWorkingDirectory() === rPath[0];
        });

    if (repo.length) {
        repo = repo[0];
    } else {
        return;
    }

    var status = repo.statuses[justFilePath];

    if (status) {
        if (editor) {
            $(editor.editorElement).addClass('git-revert-active');
        }
        panel = atom.workspace.addModalPanel({
            item: html
        });

        //set filename

        html.find('.git-revert-filename').text(atom.config.get('atom-git-revert.showFullFilePathInModal') ? currentPath : rPath[1]);

        html.off('click');
        html.on('click', '.btn', function (e) {
            destroyPanel();
            if ($(e.target).hasClass('yes')) {
                //is 0 always good?
                var reverted = repo.checkoutHead(currentPath);
                if (reverted) {
                    atom.notifications.addSuccess('File ' + currentPath + ' reverted!');
                }
            }
        });
    } else {
        atom.notifications.addInfo('File ' + currentPath + ' is in sync with HEAD!');
    }
};

module.exports = {
    config: {
        showFullFilePathInModal: {
            type: 'boolean',
            default: false
        }
    },

    activate: function () {
        atom.commands.add('atom-text-editor', 'git-revert:revert', function () {
            revert();
        });
        atom.commands.add('atom-text-editor', 'git-revert:close', function () {
            if (panel) {
                destroyPanel();
            }
        });
        atom.commands.add('.tree-view', 'git-revert:revert', function (event) {
            var path = event.target.getAttribute('data-path');
            revert(path);
        });
    }
};
