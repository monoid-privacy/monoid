package jsonschema

func constructEmptyObject(schema *Schema) map[string]interface{} {
	res := map[string]interface{}{}

	if schema == nil {
		return res
	}

	for k, v := range schema.Properties {
		switch v.Type {
		case "string":
			res[k] = ""
		case "number":
			res[k] = 0
		case "integer":
			res[k] = 0
		case "object":
			res[k] = constructEmptyObject(v)
		case "array":
			res[k] = []string{}
		case "boolean":
			res[k] = false
		}
	}

	return res
}

func MergeData(
	oldData map[string]interface{},
	newData map[string]interface{},
	schema *Schema,
) map[string]interface{} {
	res := map[string]interface{}{}

	if schema == nil {
		return newData
	}

	for k, v := range schema.Properties {
		switch v.Type {
		case "string":
			fallthrough
		case "number":
			fallthrough
		case "integer":
			fallthrough
		case "boolean":
			fallthrough
		case "array":
			if _, ok := newData[k]; ok {
				res[k] = newData[k]
			} else {
				res[k] = oldData[k]
			}
		case "object":
			if _, ok := newData[k]; !ok {
				res[k] = oldData[k]
				break
			}

			if _, ok := oldData[k]; !ok {
				res[k] = newData[k]
				break
			}

			nd, newOk := newData[k].(map[string]interface{})
			od, oldOk := oldData[k].(map[string]interface{})

			if !newOk {
				res[k] = oldData[k]
				break
			}

			if !oldOk {
				res[k] = newData[k]
				break
			}

			res[k] = MergeData(od, nd, v)
		}
	}

	return res
}

func HideSecrets(data map[string]interface{}, schema *Schema) {
	for k, v := range schema.Properties {
		switch v.Type {
		case "string":
			if v.Secret {
				data[k] = ""
			}
		case "number":
			if v.Secret {
				data[k] = 0
			}
		case "integer":
			if v.Secret {
				data[k] = 0
			}
		case "object":
			if v.Secret {
				data[k] = constructEmptyObject(v)
			}

			sub, ok := data[k].(map[string]interface{})
			if ok {
				HideSecrets(sub, v)
			}
		case "array":
			if v.Secret {
				data[k] = []string{}
			}
		case "boolean":
			if v.Secret {
				data[k] = false
			}
		}
	}
}
