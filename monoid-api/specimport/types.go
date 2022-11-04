package specimport

type IntegrationManifestEntry struct {
	ID          string `yaml:"id"`
	Name        string `yaml:"name"`
	DocURL      string `yaml:"documentationUrl"`
	DockerImage string `yaml:"dockerImage"`
	DockerTag   string `yaml:"dockerTag"`
	Logo        string `yaml:"logo"`
}

type IntegrationFullSpecEntry struct {
	IntegrationManifestEntry `yaml:",inline"`
	Spec                     map[string]interface{} `yaml:"spec"`
}
