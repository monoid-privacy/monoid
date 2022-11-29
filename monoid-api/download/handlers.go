package download

import (
	"net/http"
	"os"
	"time"

	"github.com/gorilla/mux"
	"github.com/monoid-privacy/monoid/config"
	"github.com/monoid-privacy/monoid/model"
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

	f, err := os.Open(df.StoragePath)
	if err != nil {
		w.WriteHeader(http.StatusNotFound)
		return
	}

	defer f.Close()

	w.Header().Set("Content-Disposition", "attachment; filename=\"result.tar.gz\"")

	http.ServeContent(w, r, "result.tar.gz", time.Now(), f)
}
