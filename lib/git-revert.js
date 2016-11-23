var $ = require('jquery');
var html = $(
'<div class="block text-center">' +
    '<h2>Are you sure you want to revert this file?</h2>' +
    '<p class="git-revert-filename"></p>' +
    '<div class="block git-revert-buttons">' +
        '<button class="inline-block-tight btn btn-lg cancel">Cancel</button>' +
        '<button class="inline-block-tight btn btn-lg btn-error yes icon icon-zap">Revert</button>' +
    '</div>' +
'</div>'
);
var panel;
var editor;
var destroyPanel = function () {
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
        currentPath = path;
    } else {
        editor = atom.workspace.getActiveTextEditor();
        currentPath = editor.getPath();
    }
    var repo = atom.project.getRepositories()[0];
    if (!repo || !currentPath) {
        return;
    }
    var repoPath = repo.path.replace('.git', ''),
        status = repo.statuses[currentPath.replace(repoPath, '')];

    if (status) {
        if (editor) {
            $(editor.editorElement).addClass('git-revert-active');
        }
        panel = atom.workspace.addModalPanel({
            item: html
        });

        //set filename
        html.find('.git-revert-filename').text(currentPath);

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
