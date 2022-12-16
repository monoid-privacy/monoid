package download

import (
	"context"
	"io"
	"net/http"

	"github.com/gorilla/mux"
	"github.com/monoid-privacy/monoid/config"
	"github.com/monoid-privacy/monoid/model"
	"github.com/rs/zerolog/log"
)

type DownloadHandler struct {
	Conf *config.BaseConfig
}

func (dh *DownloadHandler) HandleDownload(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)

	id, ok := vars["id"]
	if !ok {
		w.WriteHeader(http.StatusNotFound)
		return
	}

	df := model.DownloadableFile{}
	if err := dh.Conf.DB.Where("id = ?", id).First(&df).Error; err != nil {
		w.WriteHeader(http.StatusNotFound)
		return
	}

	f, err := dh.Conf.FileStore.NewReader(context.Background(), df.StoragePath, false)
	if err != nil {
		w.WriteHeader(http.StatusNotFound)
		return
	}

	defer f.Close()
	w.Header().Set("Content-Disposition", "attachment; filename=\"result.tar.gz\"")
	w.Header().Set("Content-Type", "application/octet-stream")

	if _, err := io.Copy(w, f); err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		log.Err(err).Msg("Error writing file")
	}
}
